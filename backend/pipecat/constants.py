"""
Pipecat Bot Configuration Constants

Centralized configuration for all Pipecat bot settings.
Values can be overridden via environment variables.
"""

import os
from dataclasses import dataclass, field
from typing import List


@dataclass
class VoiceConfig:
    """Voice and TTS configuration."""
    # Default voice ID (Leo from Cartesia)
    default_voice_id: str = "0834f3df-e650-4766-a20c-5a93a43aa6e3"
    default_emotion: str = "neutral"

    # TTS settings
    tts_model: str = "sonic-3"

    # Available voices (Cartesia UUIDs)
    available_voices: dict = field(default_factory=lambda: {
        "leo": "0834f3df-e650-4766-a20c-5a93a43aa6e3",
        "jace": "6776173b-fd72-460d-89b3-d85812ee518d",
        "kyle": "c961b81c-a935-4c17-bfb3-ba2239de8c2f",
        "gavin": "f4a3a8e4-694c-4c45-9ca0-27caf97901b5",
        "maya": "cbaf8084-f009-4838-a096-07ee2e6612b1",
        "tessa": "6ccbfb76-1fc6-48f7-b71d-91ac6298247b",
        "dana": "cc00e582-ed66-4004-8336-0175b85c85f6",
        "marian": "26403c37-80c1-4a1a-8692-540551ca2ae5",
    })


@dataclass
class LLMConfig:
    """LLM configuration."""
    model: str = "gemini-2.5-flash-lite"
    anthropic_model: str = "claude-sonnet-4-20250514"
    temperature: float = 0.7
    max_tokens: int = 512
    provider: str = "google"


@dataclass
class STTConfig:
    """Speech-to-Text configuration."""
    model: str = "ink-whisper"
    language: str = "en"
    provider: str = "cartesia"


@dataclass
class VADConfig:
    """Voice Activity Detection configuration.

    IMPORTANT: stop_secs=0.2 is required when using Smart Turn Detection.
    The ML-based turn analyzer handles the actual end-of-turn decision,
    so VAD just needs to detect brief pauses quickly.
    """
    confidence: float = 0.7       # Slightly more sensitive than 0.75
    start_secs: float = 0.2       # Faster speech start detection
    stop_secs: float = 0.2        # Must be 0.2 for Smart Turn Detection
    min_volume: float = 0.6


@dataclass
class CallLimitsConfig:
    """Call duration and limits configuration."""
    # Maximum call duration in seconds (30 minutes)
    max_duration_seconds: int = 1800
    # User idle timeout in seconds for natural conversation prompts
    # Research-backed: 12 seconds balances responsiveness without being pushy
    # - Too short (<8s): feels pushy, doesn't give time to think
    # - Too long (>20s): awkward silence, loses engagement
    # - 12s: balanced for coaching conversations
    # Note: With retry callback, bot will prompt up to 3 times before giving up
    user_idle_timeout_seconds: float = 12.0
    # Default remaining minutes (free tier)
    default_remaining_minutes: int = 10


@dataclass
class ReconnectionConfig:
    """Connection retry configuration."""
    max_attempts: int = 3
    # Exponential backoff base (2^attempt seconds)
    backoff_base: int = 2


@dataclass
class PipecatConfig:
    """
    Main Pipecat configuration class.

    All values can be overridden via environment variables.
    """
    voice: VoiceConfig = field(default_factory=VoiceConfig)
    llm: LLMConfig = field(default_factory=LLMConfig)
    stt: STTConfig = field(default_factory=STTConfig)
    vad: VADConfig = field(default_factory=VADConfig)
    call_limits: CallLimitsConfig = field(default_factory=CallLimitsConfig)
    reconnection: ReconnectionConfig = field(default_factory=ReconnectionConfig)

    def __post_init__(self):
        """Load environment variable overrides after initialization."""
        self._load_env_overrides()

    def _load_env_overrides(self):
        """Load configuration overrides from environment variables."""
        # Voice config
        self.voice.default_voice_id = os.getenv(
            "DEFAULT_VOICE_ID",
            os.getenv("VOICE_ID", self.voice.default_voice_id)
        )
        self.voice.default_emotion = os.getenv(
            "DEFAULT_VOICE_EMOTION",
            os.getenv("VOICE_EMOTION", self.voice.default_emotion)
        )

        # LLM config
        self.llm.provider = os.getenv("LLM_PROVIDER", self.llm.provider)
        if self.llm.provider == "anthropic":
            self.llm.model = os.getenv("ANTHROPIC_MODEL", self.llm.anthropic_model)
        else:
            self.llm.model = os.getenv("GOOGLE_MODEL", self.llm.model)
        self.llm.temperature = float(os.getenv(
            "LLM_TEMPERATURE",
            os.getenv("GOOGLE_TEMPERATURE", str(self.llm.temperature))
        ))
        self.llm.max_tokens = int(os.getenv("LLM_MAX_TOKENS", str(self.llm.max_tokens)))

        # STT config
        self.stt.model = os.getenv("CARTESIA_STT_MODEL", self.stt.model)
        self.stt.language = os.getenv("CARTESIA_STT_LANGUAGE", self.stt.language)

        # VAD config
        self.vad.confidence = float(os.getenv("VAD_CONFIDENCE", str(self.vad.confidence)))
        self.vad.start_secs = float(os.getenv("VAD_START_SECS", str(self.vad.start_secs)))
        self.vad.stop_secs = float(os.getenv("VAD_STOP_SECS", str(self.vad.stop_secs)))
        self.vad.min_volume = float(os.getenv("VAD_MIN_VOLUME", str(self.vad.min_volume)))

        # Call limits
        self.call_limits.max_duration_seconds = int(os.getenv(
            "MAX_CALL_DURATION_SECONDS",
            os.getenv("MAX_CALL_DURATION", str(self.call_limits.max_duration_seconds))
        ))
        self.call_limits.user_idle_timeout_seconds = float(os.getenv(
            "USER_IDLE_TIMEOUT_SECONDS",
            str(self.call_limits.user_idle_timeout_seconds)
        ))
        self.call_limits.default_remaining_minutes = int(os.getenv(
            "DEFAULT_REMAINING_MINUTES",
            str(self.call_limits.default_remaining_minutes)
        ))


# Singleton instance for easy access
PIPECAT_CONFIG = PipecatConfig()


# Convenience accessors for backward compatibility
def get_voice_id() -> str:
    """Get configured voice ID."""
    return PIPECAT_CONFIG.voice.default_voice_id


def get_voice_emotion() -> str:
    """Get configured voice emotion."""
    return PIPECAT_CONFIG.voice.default_emotion


def get_llm_model() -> str:
    """Get configured LLM model."""
    return PIPECAT_CONFIG.llm.model


def get_vad_params() -> dict:
    """Get VAD parameters as a dictionary."""
    return {
        "confidence": PIPECAT_CONFIG.vad.confidence,
        "start_secs": PIPECAT_CONFIG.vad.start_secs,
        "stop_secs": PIPECAT_CONFIG.vad.stop_secs,
        "min_volume": PIPECAT_CONFIG.vad.min_volume,
    }


def get_stt_config() -> dict:
    """Get STT configuration as a dictionary."""
    return {
        "model": PIPECAT_CONFIG.stt.model,
        "language": PIPECAT_CONFIG.stt.language,
    }


def resolve_voice_id(voice_id_or_name: str) -> str:
    """
    Resolve a voice name to its UUID.

    Args:
        voice_id_or_name: Either a voice name (e.g., "leo") or UUID

    Returns:
        The voice UUID
    """
    name_lower = voice_id_or_name.lower()
    if name_lower in PIPECAT_CONFIG.voice.available_voices:
        return PIPECAT_CONFIG.voice.available_voices[name_lower]
    return voice_id_or_name
