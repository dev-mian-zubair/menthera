"""
Production-ready conversational bot using Pipecat 0.0.104.
Fixes voice cutting, prevents self-feedback, and adds rich logging.
Includes natural conversation flow with context-aware idle prompts.
"""

import time
import os
import asyncio
from typing import Optional, List
from dataclasses import dataclass, field
from enum import Enum
from loguru import logger

# === Pipecat imports ===
from pipecat.frames.frames import (
    TextFrame,
    UserStartedSpeakingFrame,
    UserStoppedSpeakingFrame,
    TranscriptionFrame,
    LLMRunFrame,
    LLMMessagesAppendFrame,
    TTSSpeakFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.processors.frame_processor import FrameProcessor
from pipecat.transports.daily.transport import DailyParams, DailyTransport
from pipecat.audio.vad.silero import SileroVADAnalyzer, VADParams
from pipecat.audio.turn.smart_turn.local_smart_turn_v3 import LocalSmartTurnAnalyzerV3
from pipecat.services.cartesia.stt import CartesiaSTTService
from pipecat.services.cartesia.tts import CartesiaTTSService, GenerationConfig, TextAggregationMode
from pipecat.services.google.llm import GoogleLLMService
from pipecat.services.anthropic.llm import AnthropicLLMService
from pipecat.processors.aggregators.openai_llm_context import (
    OpenAILLMContext,
)
from pipecat.processors.user_idle_processor import UserIdleProcessor
from pipecat.processors.frameworks.rtvi import RTVIProcessor

# === Local imports ===
try:
    from .config import BotConfig
    from .db_client import DynamoDBClient
    from .constants import PIPECAT_CONFIG
except ImportError:
    from config import BotConfig
    from db_client import DynamoDBClient
    from constants import PIPECAT_CONFIG


# ======================================================================
#                      CONVERSATION STATE TRACKING
# ======================================================================

class BotActionType(Enum):
    """Types of bot actions for context-aware idle prompts."""
    GREETING = "greeting"
    QUESTION = "question"           # Bot asked something → shorter wait feels natural
    STATEMENT = "statement"         # Bot made a statement → medium wait
    EMOTIONAL_SUPPORT = "emotional" # Bot offered support → longer wait, softer prompt
    REFLECTION = "reflection"       # Bot summarized user's words → medium wait


@dataclass
class ConversationState:
    """
    Tracks conversation context for natural idle prompts.

    Based on research best practices:
    - Context-aware prompts feel more natural than generic "Are you still there?"
    - Emotional moments need extra space (therapeutic silence is valuable)
    - Different bot actions warrant different follow-up styles
    """

    last_bot_action: BotActionType = BotActionType.GREETING
    emotional_moment: bool = False      # User shared something heavy
    exchange_count: int = 0             # How many back-and-forths
    last_user_message: str = ""         # For context in prompts
    last_activity_time: float = field(default_factory=time.time)

    def update_from_assistant(self, text: str):
        """Detect action type from assistant's response."""
        if not text:
            return

        text_lower = text.lower()

        # Question detection: ends with ?
        if text.rstrip().endswith("?"):
            self.last_bot_action = BotActionType.QUESTION
        # Emotional support detection: supportive phrases
        elif any(phrase in text_lower for phrase in [
            "i understand", "that sounds", "i hear you",
            "that must be", "i'm here for you", "it's okay",
            "that's really", "i can imagine", "it makes sense",
            "take your time", "no pressure"
        ]):
            self.last_bot_action = BotActionType.EMOTIONAL_SUPPORT
            self.emotional_moment = True
        # Reflection detection: summarizing phrases
        elif any(phrase in text_lower for phrase in [
            "so you're saying", "it sounds like", "what i'm hearing",
            "if i understand", "you mentioned"
        ]):
            self.last_bot_action = BotActionType.REFLECTION
        else:
            self.last_bot_action = BotActionType.STATEMENT

        self.last_activity_time = time.time()

    def update_from_user(self, text: str):
        """Track user message and reset emotional flag after they respond."""
        self.last_user_message = text
        self.exchange_count += 1
        self.emotional_moment = False  # User responded, moment passed
        self.last_activity_time = time.time()

    def reset(self):
        """Reset state for new conversation."""
        self.last_bot_action = BotActionType.GREETING
        self.emotional_moment = False
        self.exchange_count = 0
        self.last_user_message = ""
        self.last_activity_time = time.time()


class ContextAwareIdleHandler:
    """
    Handles user idle events with context-aware, coaching-focused prompts.

    Based on research best practices:
    - Google Voice Design: Max 3 no-input events before escalation
    - Pipecat patterns: Use LLMMessagesAppendFrame for natural LLM-generated prompts
    - Mental health AI: Emotional moments need space, not rushing to fill silence
    - ElevenLabs: Context-aware prompts without interrupting flow
    """

    def __init__(self, bot: "SimplePipecatBot"):
        self.bot = bot
        self.retry_count = 0
        self.max_retries = 3
        self.logger = logger.bind(component="IdleHandler")

    def reset(self):
        """Reset retry count when user speaks."""
        if self.retry_count > 0:
            self.logger.debug(f"[IdleHandler] Reset retry count (was {self.retry_count})")
        self.retry_count = 0

    async def handle_idle(self, processor: UserIdleProcessor, retry_count: int) -> bool:
        """
        Handle idle event with escalating, context-aware responses.
        Returns True to continue monitoring, False to stop.

        Note: retry_count is passed by UserIdleProcessor, but we track our own
        for more control over the flow.
        """
        # Check if call is still active - don't process idle if:
        # 1. Call hasn't started yet (no human joined)
        # 2. Call is ending/ended
        if not self.bot._call_active:
            if self.bot._ending_call:
                self.logger.info("[IdleHandler] Call is ending, stopping idle monitoring")
            else:
                self.logger.debug("[IdleHandler] Call not yet active (no human joined), skipping idle")
            return False

        self.retry_count = retry_count
        state = self.bot.conversation_state

        self.logger.info(
            f"[IdleHandler] Idle detected: retry={retry_count}, "
            f"action={state.last_bot_action.value}, emotional={state.emotional_moment}"
        )

        # Emotional moment? Give extra space on first retry
        if state.emotional_moment and retry_count == 1:
            self.logger.info("[IdleHandler] Emotional moment - giving extra space, skipping first prompt")
            return True  # Wait another cycle without prompting

        if retry_count == 1:
            return await self._gentle_engagement(processor)
        elif retry_count == 2:
            return await self._soft_checkin(processor)
        else:
            return await self._offer_to_pause(processor)

    async def _gentle_engagement(self, processor: UserIdleProcessor) -> bool:
        """First prompt: Gentle, context-aware engagement via LLM."""
        prompt = self._get_contextual_prompt()

        self.logger.info(f"[IdleHandler] Retry 1 - Gentle engagement: {prompt[:80]}...")

        # Use LLM to generate natural, contextual response
        await processor.push_frame(LLMMessagesAppendFrame(
            messages=[{"role": "system", "content": prompt}],
            run_llm=True
        ))
        return True

    async def _soft_checkin(self, processor: UserIdleProcessor) -> bool:
        """Second prompt: Soft check-in via LLM."""
        prompt = (
            "The user is still quiet. Warmly check in with them — perhaps ask if they'd like "
            "to continue, explore a different topic, or just need a moment to think. "
            "Keep it brief, gentle, and supportive. Don't repeat what you said before."
        )

        self.logger.info("[IdleHandler] Retry 2 - Soft check-in")

        await processor.push_frame(LLMMessagesAppendFrame(
            messages=[{"role": "system", "content": prompt}],
            run_llm=True
        ))
        return True

    async def _offer_to_pause(self, processor: UserIdleProcessor) -> bool:
        """Third prompt: Offer to pause/end gracefully via direct TTS."""
        self.logger.info("[IdleHandler] Retry 3 - Offering to pause, will end monitoring")

        # Use direct TTS for consistent, predictable farewell
        # (not LLM, to ensure we don't get stuck in another prompt loop)
        await processor.push_frame(TTSSpeakFrame(
            text="It seems like you might need some time, and that's completely okay. "
                 "I'm here whenever you're ready to continue. Take care of yourself!"
        ))

        # Return False to stop idle monitoring
        # The call will end naturally when user disconnects, or continue if they speak
        return False

    def _get_contextual_prompt(self) -> str:
        """Generate context-aware prompt based on conversation state."""
        action = self.bot.conversation_state.last_bot_action

        if action == BotActionType.QUESTION:
            return (
                "The user hasn't responded to your question yet. Gently invite them to share — "
                "perhaps rephrase the question more simply, or let them know there's no pressure "
                "and they can take their time. Keep it brief, warm, and conversational."
            )

        elif action == BotActionType.EMOTIONAL_SUPPORT:
            return (
                "The user is quiet after you offered support. They may be processing their feelings. "
                "Offer a soft, supportive presence — something like acknowledging you're here with them, "
                "or that it's okay to take time. Don't ask questions right now, just hold space gently."
            )

        elif action == BotActionType.REFLECTION:
            return (
                "The user is quiet after you reflected back what they said. "
                "Gently ask if you captured it right, or softly invite them to share more. "
                "Keep it brief and open-ended."
            )

        elif action == BotActionType.GREETING:
            return (
                "The user hasn't responded to your greeting yet. Warmly try to engage them — "
                "perhaps ask what's on their mind today, or what brought them here. "
                "Keep it casual, inviting, and low-pressure."
            )

        else:  # STATEMENT
            return (
                "The user has been quiet for a moment. Gently engage them — "
                "perhaps ask what they're thinking, or invite them to share what's on their mind. "
                "Keep it natural, warm, and conversational."
            )


# ======================================================================
#                           LOGGING PROCESSORS
# ======================================================================

class LoggingProcessor(FrameProcessor):
    """Logs all frames flowing through the pipeline for debugging and monitoring."""
    async def process_frame(self, frame, direction):
        # Always call super first to handle system frames like StartFrame
        await super().process_frame(frame, direction)

        try:
            frame_name = frame.__class__.__name__
            info = {}
            for attr in ("user_id", "participant_id", "text", "timestamp", "role"):
                if hasattr(frame, attr):
                    info[attr] = getattr(frame, attr)
            logger.debug(f"[Pipeline] Frame={frame_name} | {info}")
        except Exception as e:
            logger.exception(f"[LoggingProcessor] Error logging frame: {e}")


class DropBotAudioProcessor(FrameProcessor):
    """Drops any audio frames that originate from the bot (prevents self-listening)."""
    def __init__(self, bot_participant_id_getter):
        super().__init__()
        self._get_bot_id = bot_participant_id_getter

    async def process_frame(self, frame, direction):
        # Always call super first to handle system frames like StartFrame
        await super().process_frame(frame, direction)

        # Check if this frame is from the bot itself
        pid = getattr(frame, "participant_id", None)
        bot_pid = self._get_bot_id()

        # Drop only if the frame is specifically from the bot AND has a participant_id
        if pid and bot_pid and pid == bot_pid:
            logger.debug(f"[DropBotAudioProcessor] Dropped frame from bot participant {pid}")
            # Don't pass this frame downstream (effectively filters it out)
            return

        # Pass all other frames downstream (including frames without participant_id)
        await self.push_frame(frame, direction)


class TranscriptTrackingProcessor(FrameProcessor):
    """
    Tracks conversation messages for transcript generation and state updates.

    Also updates ConversationState for context-aware idle prompts.
    """

    def __init__(
        self,
        conversation_history: list,
        conversation_state: Optional[ConversationState] = None,
        idle_handler: Optional[ContextAwareIdleHandler] = None,
        role: str = "user",  # "user" or "assistant" - which role this tracker handles
        call_active_check: Optional[callable] = None  # Function to check if call is active
    ):
        super().__init__()
        self.conversation_history = conversation_history
        self.state = conversation_state
        self.idle_handler = idle_handler
        self.role = role
        self._call_active_check = call_active_check

    async def process_frame(self, frame, direction):
        # Always call super first
        await super().process_frame(frame, direction)

        # Skip tracking if call is no longer active
        if self._call_active_check and not self._call_active_check():
            await self.push_frame(frame, direction)
            return

        try:
            # Track user transcriptions
            if isinstance(frame, TranscriptionFrame) and self.role == "user":
                self.conversation_history.append({
                    'role': 'user',
                    'content': frame.text,
                    'timestamp': time.time()
                })

                # Update conversation state
                if self.state:
                    self.state.update_from_user(frame.text)

                # Reset idle handler when user speaks
                if self.idle_handler:
                    self.idle_handler.reset()

                # Log at INFO level for diagnostics
                preview = frame.text[:100] + "..." if len(frame.text) > 100 else frame.text
                logger.info(f"[TranscriptTracking] 📝 User ({len(self.conversation_history)} msgs): {preview}")

            # Track assistant responses
            elif isinstance(frame, TextFrame) and self.role == "assistant":
                # Only track if it's actual response text (not system messages)
                if hasattr(frame, 'text') and frame.text:
                    self.conversation_history.append({
                        'role': 'assistant',
                        'content': frame.text,
                        'timestamp': time.time()
                    })

                    # Update conversation state
                    if self.state:
                        self.state.update_from_assistant(frame.text)

                    # Log at INFO level for diagnostics
                    preview = frame.text[:100] + "..." if len(frame.text) > 100 else frame.text
                    logger.info(f"[TranscriptTracking] 🤖 Assistant ({len(self.conversation_history)} msgs): {preview}")

        except Exception as e:
            logger.exception(f"[TranscriptTracking] Error tracking frame: {e}")

        # Pass frame downstream
        await self.push_frame(frame, direction)


# ======================================================================
#                               MAIN BOT
# ======================================================================

class SimplePipecatBot:
    """Production-ready conversational bot using Pipecat 0.0.94."""

    def __init__(self, config: BotConfig):
        self.config = config

        # Logging context
        self.user_id = os.getenv("USER_ID")
        self.call_id = os.getenv("CALL_ID")
        self.agent_id = os.getenv("AGENT_ID")
        self.memory_context = os.getenv("MEMORY_CONTEXT", "")
        self.logger = logger.bind(user_id=self.user_id, call_id=self.call_id)

        # Diagnostic logging for SQS troubleshooting
        logger.info(f"🔧 Bot init: user_id={self.user_id}, call_id={self.call_id}, agent_id={self.agent_id!r}")

        # Core services
        self.stt = None
        self.tts = None
        self.llm = None

        # Pipeline components
        self.transport = None
        self.task = None
        self.runner = None

        # Call tracking
        self.start_time = time.time()
        self.db_client = DynamoDBClient()
        self.max_duration_seconds = int(os.getenv(
            "MAX_CALL_DURATION",
            str(PIPECAT_CONFIG.call_limits.max_duration_seconds)
        ))
        self.duration_timer_task = None

        # Quota enforcement
        # Parse remaining minutes as float first, then convert to int (handles decimal values like "8.55")
        self.remaining_minutes = int(float(os.getenv(
            "REMAINING_MINUTES",
            str(PIPECAT_CONFIG.call_limits.default_remaining_minutes)
        )))
        self.quota_timer_task = None

        # Reconnection tracking
        self.reconnection_attempts = 0
        self.max_reconnection_attempts = PIPECAT_CONFIG.reconnection.max_attempts
        self.is_reconnecting = False

        # Status monitoring for graceful shutdown signal from user-left handler
        self.status_monitor_task = None

        # Orphan bot detection - terminate if no user joins within timeout
        self._user_has_joined = False
        self._orphan_timeout_task = None
        self._orphan_timeout_seconds = 60  # 60 seconds to wait for user to join

        # Transcript tracking for memory extraction
        self.conversation_history = []

        # Conversation state for context-aware idle prompts
        self.conversation_state = ConversationState()

        # Context-aware idle handler (initialized after services)
        self.idle_handler = None

        # Re-entrance guard for call-end handling (prevents multiple end signals from racing)
        self._ending_call = False

        # Flag to control pipeline activity - only active when human joins
        # Starts as False, set to True when first human participant joins
        self._call_active = False

        # Initialize services
        self._init_services()
        self.logger.info(
            f"Bot initialized with {config.llm_provider} LLM, {config.stt_provider} STT, and {config.tts_provider} TTS"
        )

        if self.memory_context:
            self.logger.info(f"Loaded memory context: {len(self.memory_context)} characters")

    # -------------------------- Initialization --------------------------

    def _init_services(self):
        """Initialize STT, TTS, and LLM services."""

        # STT: Cartesia Whisper-based model
        self.stt = CartesiaSTTService(
            api_key=self.config.cartesia_api_key,
            model=self.config.cartesia_stt_model,
            language=self.config.cartesia_stt_language,
        )
        self.logger.info(f"STT initialized: {self.config.cartesia_stt_model} ({self.config.cartesia_stt_language})")

        # TTS: Cartesia Sonic-3 with voice and emotion
        self._init_tts_service()

        # LLM: Google Gemini / PaLM API
        self._init_llm_service()

        # System prompt
        system_prompt = os.getenv("AGENT_CALL_PROMPT") or (
            "You are a friendly AI assistant. "
            "Keep responses conversational, natural, and concise. "
            "Avoid markdown and formatting — this is a voice conversation."
        )

        # Add memory context if available
        if self.memory_context:
            system_prompt += f"\n\nPrevious context about this user:\n{self.memory_context}"
            self.logger.info("Added memory context to system prompt")

        system_messages = [{"role": "system", "content": system_prompt}]
        self.context = OpenAILLMContext(messages=system_messages)
        self.context_aggregator = self.llm.create_context_aggregator(self.context)

        # Processors
        self.rtvi = RTVIProcessor()

        # Initialize context-aware idle handler
        self.idle_handler = ContextAwareIdleHandler(bot=self)

        # UserIdleProcessor with context-aware callback
        # Timeout: 12 seconds (research-backed balance for coaching)
        self.user_idle = UserIdleProcessor(
            callback=self.idle_handler.handle_idle,
            timeout=PIPECAT_CONFIG.call_limits.user_idle_timeout_seconds
        )
        self.logger.info(
            f"Idle handler initialized: timeout={PIPECAT_CONFIG.call_limits.user_idle_timeout_seconds}s, "
            f"max_retries={self.idle_handler.max_retries}"
        )

    def _init_tts_service(self):
        """Initialize TTS."""
        self.tts = CartesiaTTSService(
            api_key=self.config.cartesia_api_key,
            voice_id=self.config.voice_id,
            model="sonic-3",
            text_aggregation_mode=TextAggregationMode.SENTENCE,
            params=CartesiaTTSService.InputParams(
                generation_config=GenerationConfig(emotion=self.config.voice_emotion)
            ),
        )
        self.logger.info(f"TTS initialized: voice={self.config.voice_id}, emotion={self.config.voice_emotion}")

    def _init_llm_service(self):
        """Initialize LLM based on configured provider (google or anthropic)."""
        system_instruction = os.getenv("AGENT_CALL_PROMPT") or (
            "You are a friendly AI assistant. "
            "Keep responses conversational, helpful, and concise."
        )

        if self.config.llm_provider == "anthropic":
            self.llm = AnthropicLLMService(
                api_key=self.config.anthropic_api_key,
                model=self.config.llm_model,
                params=AnthropicLLMService.InputParams(
                    max_tokens=PIPECAT_CONFIG.llm.max_tokens,
                    temperature=self.config.llm_temperature,
                ),
            )
            self.logger.info(f"LLM initialized: Anthropic {self.config.llm_model}")
        else:
            self.llm = GoogleLLMService(
                api_key=self.config.google_api_key,
                model=self.config.llm_model,
                temperature=self.config.llm_temperature,
                system_instruction=system_instruction,
                max_tokens=PIPECAT_CONFIG.llm.max_tokens,
            )
            self.logger.info(f"LLM initialized: Google {self.config.llm_model}")

    # -------------------------- Transport Setup --------------------------

    async def setup_transport(self, room_url: str, token: Optional[str] = None):
        """Initialize Daily transport."""
        token = token or os.getenv("DAILY_BOT_TOKEN")
        if not token:
            self.logger.warning("No DAILY_BOT_TOKEN provided or found in environment")

        vad_params = VADParams(
            confidence=PIPECAT_CONFIG.vad.confidence,
            start_secs=PIPECAT_CONFIG.vad.start_secs,
            stop_secs=PIPECAT_CONFIG.vad.stop_secs,
            min_volume=PIPECAT_CONFIG.vad.min_volume,
        )

        transport_params = DailyParams(
            audio_out_enabled=True,
            audio_in_enabled=True,
            audio_in_stream_on_start=True,  # start audio streaming immediately on pipeline start
            audio_in_user_tracks=True,  # CRITICAL: enables individual participant audio capture
            audio_out_silence_secs=1.0,  # prevents voice cutting
            vad_analyzer=SileroVADAnalyzer(params=vad_params),
            turn_analyzer=LocalSmartTurnAnalyzerV3(),  # ML-based turn detection for natural conversation
            audio_in_passthrough=True,  # CRITICAL: allows audio to flow downstream to STT processor
        )

        self.transport = DailyTransport(
            room_url=room_url,
            token=token,
            bot_name=self.config.bot_name,
            params=transport_params,
        )

        # ===== EVENT HANDLERS =====
        @self.transport.event_handler("on_client_disconnected")
        async def on_client_disconnected(transport, client):
            self.logger.warning(f"⚠️  [DAILY.CO] Client disconnected: {client}")
            await self._handle_call_end()

        @self.transport.event_handler("on_first_participant_joined")
        async def on_first_participant_joined(transport, participant):
            """Called when the first HUMAN participant joins (bot is handled internally by transport)."""
            # Ignore if call is ending/ended
            if self._ending_call:
                self.logger.warning(f"⚠️ [DAILY.CO] Ignoring participant join - call is ending: {participant['id']}")
                return

            # Activate the pipeline now that a human has joined
            self._call_active = True
            self.logger.info(f"✅ [DAILY.CO] First human participant joined: {participant['id']} - pipeline activated")

            # Mark that user has joined - cancel orphan timeout
            self._user_has_joined = True
            if self._orphan_timeout_task:
                self._orphan_timeout_task.cancel()
                self.logger.info("✅ [ORPHAN] Orphan timeout cancelled - user joined")

            try:
                # Capture audio from this human participant
                await transport.capture_participant_audio(participant["id"])
                self.logger.info(f"✅ [AUDIO CAPTURE] Started capturing audio from participant {participant['id']}")

                # Trigger initial greeting from the bot
                await self.task.queue_frames([LLMRunFrame()])
                self.logger.info("✅ [GREETING] Queued initial LLM greeting")
            except Exception as e:
                self.logger.error(f"❌ [ERROR] Error in first participant joined: {e}", exc_info=True)

        @self.transport.event_handler("on_participant_joined")
        async def on_participant_joined(transport, participant):
            """Called when additional participants join."""
            # Ignore if call is ending/ended
            if self._ending_call:
                self.logger.warning(f"⚠️ [DAILY.CO] Ignoring participant join - call is ending: {participant['id']}")
                return

            self.logger.info(f"✅ [DAILY.CO] Participant joined: {participant['id']}")
            try:
                await transport.capture_participant_audio(participant["id"])
                self.logger.info(f"✅ [AUDIO CAPTURE] Started capturing audio from participant {participant['id']}")
            except Exception as e:
                self.logger.error(f"❌ [ERROR] Error capturing audio from participant: {e}", exc_info=True)

        @self.transport.event_handler("on_participant_left")
        async def on_participant_left(transport, participant, reason):
            self.logger.info(f"⚠️  [DAILY.CO] Participant left: {participant}, reason={reason}")
            await self._handle_call_end()

        @self.transport.event_handler("on_app_message")
        async def on_app_message(transport, message, sender):
            if "message" not in message:
                return
            msg = message["message"]
            self.logger.info(f"💬 [APP_MESSAGE] {sender}: {msg}")
            await self.task.queue_frames([
                UserStartedSpeakingFrame(),
                TranscriptionFrame(user_id=sender, timestamp=time.time(), text=msg),
                UserStoppedSpeakingFrame(),
            ])


    # -------------------------- Pipeline Setup --------------------------

    def create_pipeline(self):
        """Create Pipecat processing pipeline with natural conversation support."""
        if not self.transport:
            raise RuntimeError("Transport not initialized")

        # Add transcript tracking processors with conversation state
        # User tracker: captures TranscriptionFrames from STT, updates state, resets idle
        user_transcript_tracker = TranscriptTrackingProcessor(
            conversation_history=self.conversation_history,
            conversation_state=self.conversation_state,
            idle_handler=self.idle_handler,
            role="user",
            call_active_check=lambda: self._call_active
        )
        # Assistant tracker: captures TextFrames from LLM, updates state
        assistant_transcript_tracker = TranscriptTrackingProcessor(
            conversation_history=self.conversation_history,
            conversation_state=self.conversation_state,
            idle_handler=None,  # Only user speech resets idle
            role="assistant",
            call_active_check=lambda: self._call_active
        )

        # Pipeline with UserIdleProcessor positioned to monitor user activity
        # Research: idle processor should be after STT to detect transcription activity
        pipeline_processors = [
            self.rtvi,
            self.transport.input(),
            self.stt,  # STT: converts audio → TranscriptionFrames
            user_transcript_tracker,  # Track user transcriptions + update state + reset idle
            self.user_idle,  # Monitor for user inactivity (after STT, resets on TranscriptionFrame)
            self.context_aggregator.user(),
            self.llm,
            assistant_transcript_tracker,  # Track assistant responses + update state
            self.tts,
            self.transport.output(),
            self.context_aggregator.assistant(),
        ]

        valid_processors = [p for p in pipeline_processors if p]
        self.logger.info(f"Pipeline processors: {[p.__class__.__name__ for p in valid_processors]}")
        pipeline = Pipeline(valid_processors)
        self.task = PipelineTask(
            pipeline,
            params=PipelineParams(
                allow_interruptions=True,  # enables turn-taking when user starts speaking
                enable_metrics=True,
                enable_usage_metrics=True,
                audio_in_sample_rate=16000,   # Standard STT input rate
                audio_out_sample_rate=24000,  # Higher quality TTS output
            ),
        )

        @self.task.event_handler("on_pipeline_started")
        async def on_pipeline_started(task, frame):
            self.logger.info(f"Pipeline started: {frame}")

        @self.task.event_handler("on_pipeline_finished")
        async def on_pipeline_finished(task, frame):
            self.logger.info(f"Pipeline finished: {frame}")

        @self.task.event_handler("on_pipeline_error")
        async def on_pipeline_error(task, frame):
            self.logger.error(f"Pipeline error: {frame}")

        self.runner = PipelineRunner()

    # -------------------------- Lifecycle --------------------------

    async def start(self):
        """Start pipeline."""
        if not self.runner or not self.task:
            raise RuntimeError("Pipeline not created before start")
        self.logger.info("Starting Pipecat pipeline...")

        # Start orphan timeout (terminate if no user joins within timeout)
        self._orphan_timeout_task = asyncio.create_task(self._orphan_timeout_timer())

        # Start max duration timer
        self.duration_timer_task = asyncio.create_task(self._max_duration_timer())

        # Start quota enforcement timer
        self.quota_timer_task = asyncio.create_task(self._quota_enforcement_timer())

        # Start status monitor (detects user-left signal from Lambda)
        self.status_monitor_task = asyncio.create_task(self._status_monitor_task())

        await self.runner.run(self.task)

    async def _max_duration_timer(self):
        """Automatically end call after max duration."""
        try:
            self.logger.info(f"Max duration timer started: {self.max_duration_seconds}s ({self.max_duration_seconds // 60} min)")
            await asyncio.sleep(self.max_duration_seconds)

            self.logger.warning(f"⏱️ Max call duration reached ({self.max_duration_seconds}s), ending call...")

            # Send goodbye message before ending
            if self.transport:
                try:
                    # Optionally send a final message to the user
                    self.logger.info("Sending time limit notification to user...")
                    # Note: You could push a TextFrame here if needed
                except Exception as e:
                    self.logger.error(f"Error sending goodbye message: {e}")

            # End the call
            await self._handle_call_end_with_reason("max_duration_reached")

        except asyncio.CancelledError:
            self.logger.info("Duration timer cancelled (call ended naturally)")
        except Exception as e:
            self.logger.error(f"Error in max duration timer: {e}")

    async def _quota_enforcement_timer(self):
        """
        Server-side quota enforcement: End call when quota time is consumed.
        This prevents clients from bypassing quota checks.
        """
        try:
            quota_seconds = self.remaining_minutes * 60
            self.logger.info(f"Quota enforcement timer started: {self.remaining_minutes} min ({quota_seconds}s)")

            await asyncio.sleep(quota_seconds)

            self.logger.warning(f"⏱️ Quota limit reached ({self.remaining_minutes} min), ending call...")

            # Send notification to user before ending
            if self.transport:
                try:
                    self.logger.info("Call ending due to quota limit...")
                except Exception as e:
                    self.logger.error(f"Error sending quota limit notification: {e}")

            # End the call with quota_exceeded reason
            await self._handle_call_end_with_reason("quota_exceeded")

        except asyncio.CancelledError:
            self.logger.info("Quota enforcement timer cancelled (call ended naturally)")
        except Exception as e:
            self.logger.error(f"Error in quota enforcement timer: {e}")

    async def _orphan_timeout_timer(self):
        """
        Terminate the bot if no user joins within the timeout period.
        This prevents orphan bots from running indefinitely if:
        - The mobile app crashed before joining
        - Network issues prevented user from connecting
        - User changed their mind and never joined
        """
        try:
            self.logger.info(f"Orphan timeout timer started: {self._orphan_timeout_seconds}s")

            await asyncio.sleep(self._orphan_timeout_seconds)

            # Check if user has joined
            if not self._user_has_joined:
                self.logger.warning(
                    f"⚠️ [ORPHAN] No user joined within {self._orphan_timeout_seconds}s - "
                    f"terminating orphan bot to free resources"
                )

                # End the call with orphan_timeout reason
                await self._handle_call_end_with_reason("orphan_timeout")
            else:
                self.logger.info("Orphan timeout check: User has joined, no action needed")

        except asyncio.CancelledError:
            self.logger.info("Orphan timeout timer cancelled (user joined)")
        except Exception as e:
            self.logger.error(f"Error in orphan timeout timer: {e}", exc_info=True)

    async def _status_monitor_task(self):
        """
        Monitor DynamoDB for 'ending' status signal from user-left handler.
        Polls every 2 seconds to detect when the user has left the call.
        """
        try:
            self.logger.info("Status monitor started - watching for 'ending' signal from user-left handler")

            while True:
                await asyncio.sleep(2)  # Poll every 2 seconds

                # Check call status in DynamoDB
                call_info = await self.db_client.get_call_info(self.user_id, self.call_id)

                if call_info and call_info.get('status') == 'ending':
                    self.logger.warning("📱 User left call - 'ending' status detected. Initiating graceful shutdown...")

                    # End the call with user_left reason
                    await self._handle_call_end_with_reason("user_left_early")
                    break

        except asyncio.CancelledError:
            self.logger.info("Status monitor cancelled (call ended naturally)")
        except Exception as e:
            self.logger.error(f"Error in status monitor: {e}", exc_info=True)

    async def _attempt_reconnection(self, transport):
        """Attempt to reconnect to Daily.co room with exponential backoff."""
        self.is_reconnecting = True
        self.reconnection_attempts += 1

        # Exponential backoff: 2s, 4s, 8s
        backoff_seconds = 2 ** self.reconnection_attempts

        self.logger.warning(
            f"🔄 [RECONNECT] Attempting reconnection {self.reconnection_attempts}/{self.max_reconnection_attempts} "
            f"after {backoff_seconds}s..."
        )

        try:
            await asyncio.sleep(backoff_seconds)

            # Attempt to rejoin the room
            # Note: Pipecat's Daily transport handles reconnection internally
            # We mainly log and track the attempt here
            self.logger.info(f"✅ [RECONNECT] Reconnection attempt {self.reconnection_attempts} initiated")

            # Reset attempts on successful reconnection
            # (will be triggered by subsequent connection events)

        except Exception as e:
            self.logger.error(f"❌ [RECONNECT] Reconnection attempt {self.reconnection_attempts} failed: {e}")
        finally:
            self.is_reconnecting = False

    async def _handle_call_end(self):
        """Handle participant leaving and finalize call metrics."""
        await self._handle_call_end_with_reason("participant_left")

    async def _handle_call_end_with_reason(self, end_reason: str = "participant_left"):
        """
        Handle call end with specified reason.
        Updates call status, sends to SQS, and initiates graceful shutdown.

        Uses re-entrance guard to prevent multiple call-end signals from racing
        (e.g., participant_left + quota_exceeded + max_duration triggering simultaneously).
        """
        # Re-entrance guard - only process the first call-end signal
        if self._ending_call:
            self.logger.warning(f"⚠️  Call end already in progress, ignoring duplicate signal: {end_reason}")
            return
        self._ending_call = True

        # Mark call as inactive IMMEDIATELY to stop all event handlers and idle processing
        self._call_active = False

        self.logger.info(f"🔒 Starting call end handling: {end_reason}")

        # Cancel all timers that might still be running
        if self.duration_timer_task and not self.duration_timer_task.done():
            self.duration_timer_task.cancel()
            self.logger.info("Cancelled max duration timer")

        if self.quota_timer_task and not self.quota_timer_task.done():
            self.quota_timer_task.cancel()
            self.logger.info("Cancelled quota timer")

        if self._orphan_timeout_task and not self._orphan_timeout_task.done():
            self._orphan_timeout_task.cancel()
            self.logger.info("Cancelled orphan timeout timer")

        if self.status_monitor_task and not self.status_monitor_task.done():
            self.status_monitor_task.cancel()
            self.logger.info("Cancelled status monitor task")

        if not (self.user_id and self.call_id):
            self.logger.info("Call tracking disabled (no user_id/call_id)")
            # Still need to stop the pipeline even without tracking
            await self._stop_pipeline()
            return

        try:
            duration = int(time.time() - self.start_time)
            self.logger.info(f"📞 Call completed, duration={duration}s, reason={end_reason}")

            # Update call status in DynamoDB
            await self.db_client.update_call_status(
                self.user_id,
                self.call_id,
                "completed",
                duration=duration
            )
            self.logger.info("✅ Call status updated to 'completed'")

            # Increment user usage minutes
            await self.db_client.increment_user_usage(self.user_id, duration)
            self.logger.info(f"✅ User usage incremented by {duration}s")

            # Send call end event to SQS for memory processing
            # Diagnostic logging to identify which value is missing
            self.logger.info(f"🔍 SQS event check: agent_id={self.agent_id!r}, conversation_history_len={len(self.conversation_history)}")

            if self.agent_id and self.conversation_history:
                try:
                    # Format transcript
                    transcript = self._format_transcript()
                    self.logger.info(f"Sending call end event with transcript ({len(transcript)} chars)")

                    await self.db_client.send_call_end_event(
                        user_id=self.user_id,
                        call_id=self.call_id,
                        agent_id=self.agent_id,
                        transcript=transcript,
                        duration=duration,
                        end_reason=end_reason
                    )
                    self.logger.info("✅ Call end event sent to SQS successfully")
                except Exception as e:
                    self.logger.error(f"❌ Failed to send call end event: {e}")
            else:
                # Detailed diagnostic: which condition failed?
                missing = []
                if not self.agent_id:
                    missing.append(f"agent_id is {self.agent_id!r}")
                if not self.conversation_history:
                    missing.append(f"conversation_history is empty (len={len(self.conversation_history)})")
                self.logger.warning(f"⚠️  Skipping SQS event - {', '.join(missing)}")

            # Stop the pipeline to allow natural process termination
            await self._stop_pipeline()

        except Exception as e:
            self.logger.error(f"❌ Error updating call tracking: {e}", exc_info=True)
            # Still attempt to stop pipeline even on error
            await self._stop_pipeline()

    def _format_transcript(self) -> str:
        """Format conversation history into readable transcript."""
        if not self.conversation_history:
            return ""

        formatted_lines = []
        for entry in self.conversation_history:
            role = entry['role'].upper()
            content = entry['content']
            formatted_lines.append(f"[{role}]: {content}")

        return "\n".join(formatted_lines)

    async def _stop_pipeline(self):
        """
        Stop the pipeline runner and transport to allow natural process termination.
        This method initiates graceful shutdown after call end processing completes.
        """
        self.logger.info("🛑 Stopping pipeline runner and transport...")

        # Clear in-memory state
        self.conversation_history.clear()
        self.conversation_state.reset()
        if self.idle_handler:
            self.idle_handler.reset()
        self.logger.info("✅ Cleared in-memory state (conversation_history, conversation_state)")

        try:
            # 1. Stop the pipeline runner
            if self.runner:
                self.logger.info("Stopping pipeline runner...")
                try:
                    # Give pipeline 5 seconds to finish current processing
                    await asyncio.wait_for(
                        self.runner.stop_when_done(),
                        timeout=5.0
                    )
                    self.logger.info("✅ Pipeline runner stopped")
                except asyncio.TimeoutError:
                    self.logger.warning("⚠️  Pipeline runner stop timeout (5s), continuing...")
                except Exception as e:
                    self.logger.error(f"Error stopping pipeline runner: {e}")

            # 2. Disconnect from Daily.co transport
            if self.transport and hasattr(self.transport, '_client') and self.transport._client:
                self.logger.info("Disconnecting from Daily.co...")
                try:
                    await asyncio.wait_for(
                        self.transport._client.leave(),
                        timeout=3.0
                    )
                    self.logger.info("✅ Daily.co transport disconnected")
                except asyncio.TimeoutError:
                    self.logger.warning("⚠️  Transport disconnect timeout (3s)")
                except Exception as e:
                    self.logger.error(f"Error disconnecting transport: {e}")

            self.logger.info("✅ Pipeline and transport stopped - process will terminate naturally")

        except Exception as e:
            self.logger.error(f"❌ Error in _stop_pipeline: {e}", exc_info=True)

    async def cleanup(self):
        """
        Manual cleanup method for SIGTERM/external shutdown scenarios.
        Note: For normal call end, _handle_call_end_with_reason() already stops the pipeline.
        This is a safety net for external termination signals.
        """
        self.logger.info("🧹 Starting cleanup (external shutdown or error scenario)...")

        try:
            # 1. Cancel timers if still running
            if self.duration_timer_task and not self.duration_timer_task.done():
                self.logger.info("Cancelling duration timer...")
                self.duration_timer_task.cancel()
                try:
                    await asyncio.wait_for(self.duration_timer_task, timeout=2.0)
                except (asyncio.CancelledError, asyncio.TimeoutError):
                    pass

            if self.quota_timer_task and not self.quota_timer_task.done():
                self.logger.info("Cancelling quota enforcement timer...")
                self.quota_timer_task.cancel()
                try:
                    await asyncio.wait_for(self.quota_timer_task, timeout=2.0)
                except (asyncio.CancelledError, asyncio.TimeoutError):
                    pass

            if self.status_monitor_task and not self.status_monitor_task.done():
                self.logger.info("Cancelling status monitor...")
                self.status_monitor_task.cancel()
                try:
                    await asyncio.wait_for(self.status_monitor_task, timeout=2.0)
                except (asyncio.CancelledError, asyncio.TimeoutError):
                    pass

            # 2. Stop pipeline if not already stopped
            # (Normally _handle_call_end_with_reason() does this, but this is a safety net)
            if self.runner or self.transport:
                self.logger.info("Stopping pipeline (if not already stopped)...")
                await self._stop_pipeline()

            # 3. Handle call end tracking if not already done
            # Check if call is still marked as active (not completed/failed)
            if self.user_id and self.call_id:
                try:
                    call_info = await self.db_client.get_call_info(self.user_id, self.call_id)
                    if call_info and call_info.get('status') == 'active':
                        self.logger.info("Call still active, updating final status...")
                        duration = int(time.time() - self.start_time)
                        await self.db_client.update_call_status(
                            self.user_id,
                            self.call_id,
                            "completed",
                            duration=duration
                        )
                        await self.db_client.increment_user_usage(self.user_id, duration)
                        self.logger.info("✅ Final call status updated")
                except Exception as e:
                    self.logger.error(f"Error checking/updating call status: {e}")

            self.logger.info("✅ Cleanup completed")

        except Exception as e:
            self.logger.error(f"❌ Error during cleanup: {e}", exc_info=True)
            # Still try to update call status even if cleanup fails
            if self.user_id and self.call_id:
                try:
                    duration = int(time.time() - self.start_time)
                    await self.db_client.update_call_status(
                        self.user_id,
                        self.call_id,
                        "failed",
                        duration=duration
                    )
                    self.logger.info("Updated call status to failed after cleanup error")
                except Exception as db_error:
                    self.logger.error(f"Failed to update call status: {db_error}")
