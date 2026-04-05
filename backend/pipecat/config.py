"""
AI companion bot configuration with Cartesia STT/TTS.
Reads environment variables with sensible defaults.
Uses centralized constants from constants.py.
"""

import os
from loguru import logger

# Import centralized configuration
try:
    from .constants import PIPECAT_CONFIG, resolve_voice_id
except ImportError:
    from constants import PIPECAT_CONFIG, resolve_voice_id


class BotConfig:
    """Bot configuration with Cartesia STT/TTS and agent-specific voices."""

    def __init__(self):
        """Initialize configuration from environment variables."""
        # Note: Environment variables should be loaded in main.py before creating this config

        # Bot identity
        self.bot_name = os.getenv("BOT_NAME", "Fermi")

        # Service providers (from centralized config)
        self.llm_provider = PIPECAT_CONFIG.llm.provider
        self.stt_provider = PIPECAT_CONFIG.stt.provider
        self.tts_provider = "cartesia"  # Cartesia TTS

        # API Keys (required)
        self.cartesia_api_key = os.getenv("CARTESIA_API_KEY")
        # User's BYOK key (passed from call handler via ECS environment)
        self.google_api_key = os.getenv("USER_GOOGLE_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")

        # LLM Model settings (from centralized config, with env overrides)
        self.llm_model = PIPECAT_CONFIG.llm.model
        self.llm_temperature = PIPECAT_CONFIG.llm.temperature

        # Voice settings (from centralized config, with env overrides)
        voice_id_raw = os.getenv("VOICE_ID", PIPECAT_CONFIG.voice.default_voice_id)
        self.voice_id = resolve_voice_id(voice_id_raw)
        self.voice_emotion = os.getenv("VOICE_EMOTION", PIPECAT_CONFIG.voice.default_emotion)

        # Cartesia STT settings (from centralized config)
        self.cartesia_stt_model = PIPECAT_CONFIG.stt.model
        self.cartesia_stt_language = PIPECAT_CONFIG.stt.language

        self._validate_config()

    def _validate_config(self):
        """Validate that required configuration is present."""
        # Required API keys
        if not self.cartesia_api_key:
            raise ValueError("CARTESIA_API_KEY is required")

        if self.llm_provider == "anthropic" and not self.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY is required when LLM_PROVIDER is 'anthropic'")
        elif self.llm_provider != "anthropic" and not self.google_api_key:
            raise ValueError("USER_GOOGLE_API_KEY is required (user BYOK key must be passed from call handler)")

        # Validate voice_id (accept both voice names and UUIDs for backward compatibility)
        valid_voice_uuids = list(PIPECAT_CONFIG.voice.available_voices.values())
        valid_voice_names = [name.capitalize() for name in PIPECAT_CONFIG.voice.available_voices.keys()]

        # Accept either UUID or voice name
        if self.voice_id not in valid_voice_uuids and self.voice_id not in valid_voice_names:
            logger.warning(f"Voice ID '{self.voice_id}' not in standard list. Using as custom voice.")

    def __repr__(self) -> str:
        return (f"BotConfig(bot_name='{self.bot_name}', "
                f"llm_provider='{self.llm_provider}', "
                f"stt_provider='{self.stt_provider}', "
                f"tts_provider='{self.tts_provider}', "
                f"voice_id='{self.voice_id}', "
                f"llm_model='{self.llm_model}')")
