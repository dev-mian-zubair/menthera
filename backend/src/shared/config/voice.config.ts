/**
 * Voice and Audio Configuration
 *
 * Centralized configuration for voice IDs, TTS/STT settings,
 * VAD parameters, and ElevenLabs API settings.
 */

/**
 * Available voice definitions with Cartesia UUIDs
 */
export const AVAILABLE_VOICES = {
  leo: '0834f3df-e650-4766-a20c-5a93a43aa6e3',
  jace: '6776173b-fd72-460d-89b3-d85812ee518d',
  kyle: 'c961b81c-a935-4c17-bfb3-ba2239de8c2f',
  gavin: 'f4a3a8e4-694c-4c45-9ca0-27caf97901b5',
  maya: 'cbaf8084-f009-4838-a096-07ee2e6612b1',
  tessa: '6ccbfb76-1fc6-48f7-b71d-91ac6298247b',
  dana: 'cc00e582-ed66-4004-8336-0175b85c85f6',
  marian: '26403c37-80c1-4a1a-8692-540551ca2ae5',
} as const;

export type VoiceName = keyof typeof AVAILABLE_VOICES;

/**
 * Default voice configuration
 */
export const DEFAULT_VOICE_CONFIG = {
  /** Default voice ID (Leo) */
  voiceId: AVAILABLE_VOICES.leo,
  /** Default voice emotion */
  emotion: 'neutral',
} as const;

/**
 * ElevenLabs API configuration
 */
export const ELEVENLABS_CONFIG = {
  /** Base URL for ElevenLabs API */
  baseUrl: 'https://api.elevenlabs.io/v1',
  /** Default voice stability setting (0-1) */
  stability: 0.75,
  /** Default similarity boost setting (0-1) */
  similarityBoost: 0.75,
} as const;

/**
 * Voice Activity Detection (VAD) configuration
 */
export const VAD_CONFIG = {
  /** Confidence threshold for voice detection (0-1) */
  confidence: 0.75,
  /** Seconds of speech before triggering start */
  startSecs: 0.25,
  /** Seconds of silence before stopping */
  stopSecs: 1.5,
  /** Minimum volume threshold (0-1) */
  minVolume: 0.6,
} as const;

/**
 * Speech-to-Text (STT) configuration
 */
export const STT_CONFIG = {
  /** STT model to use */
  model: 'ink-whisper',
  /** Default language */
  language: 'en',
} as const;

/**
 * Text-to-Speech (TTS) configuration
 */
export const TTS_CONFIG = {
  /** TTS model to use */
  model: 'sonic-3',
  /** Enable sentence aggregation */
  aggregateSentences: true,
} as const;

/**
 * Environment variable names for voice config overrides
 */
export const VOICE_ENV_VARS = {
  voiceId: 'VOICE_ID',
  voiceEmotion: 'VOICE_EMOTION',
  sttModel: 'CARTESIA_STT_MODEL',
  sttLanguage: 'CARTESIA_STT_LANGUAGE',
  vadConfidence: 'VAD_CONFIDENCE',
  vadStartSecs: 'VAD_START_SECS',
  vadStopSecs: 'VAD_STOP_SECS',
  vadMinVolume: 'VAD_MIN_VOLUME',
} as const;

/**
 * Get voice config with environment variable overrides
 */
export function getVoiceConfig() {
  return {
    voiceId: process.env[VOICE_ENV_VARS.voiceId] || DEFAULT_VOICE_CONFIG.voiceId,
    emotion: process.env[VOICE_ENV_VARS.voiceEmotion] || DEFAULT_VOICE_CONFIG.emotion,
  };
}

/**
 * Get VAD config with environment variable overrides
 */
export function getVadConfig() {
  return {
    confidence: parseFloat(process.env[VOICE_ENV_VARS.vadConfidence] || '') || VAD_CONFIG.confidence,
    startSecs: parseFloat(process.env[VOICE_ENV_VARS.vadStartSecs] || '') || VAD_CONFIG.startSecs,
    stopSecs: parseFloat(process.env[VOICE_ENV_VARS.vadStopSecs] || '') || VAD_CONFIG.stopSecs,
    minVolume: parseFloat(process.env[VOICE_ENV_VARS.vadMinVolume] || '') || VAD_CONFIG.minVolume,
  };
}

/**
 * Get STT config with environment variable overrides
 */
export function getSttConfig() {
  return {
    model: process.env[VOICE_ENV_VARS.sttModel] || STT_CONFIG.model,
    language: process.env[VOICE_ENV_VARS.sttLanguage] || STT_CONFIG.language,
  };
}

/**
 * Get voice ID by name or return the provided ID if it's already a UUID
 */
export function resolveVoiceId(voiceIdOrName: string): string {
  // Check if it's a voice name
  const lowercaseName = voiceIdOrName.toLowerCase() as VoiceName;
  if (AVAILABLE_VOICES[lowercaseName]) {
    return AVAILABLE_VOICES[lowercaseName];
  }
  // Return as-is if it's already a UUID or custom voice
  return voiceIdOrName;
}
