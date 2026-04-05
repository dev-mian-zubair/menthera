/**
 * Centralized AI Model Configuration
 *
 * This file controls all AI model settings across the application.
 * Update models here to change them across all services.
 *
 * Free Tier Rate Limits (January 2026):
 * | Model                  | RPM | TPM     | RPD   |
 * |------------------------|-----|---------|-------|
 * | gemini-2.5-flash-lite  | 15  | 250,000 | 1,000 | <- Best for free tier
 * | gemini-2.5-flash       | 10  | 250,000 | 250   |
 * | gemini-2.5-pro         | 5   | 250,000 | 100   |
 */

export type ModelProvider = 'google' | 'anthropic' | 'openai';

export interface ModelConfig {
  modelId: string;
  modelProvider: ModelProvider;
  description: string;
}

export interface ServiceModelConfig {
  /** Call processor - processes call transcripts and generates summaries */
  callProcessor: ModelConfig;
  /** Message/Chat API - handles real-time chat conversations */
  messageApi: ModelConfig;
  /** Quest insights - generates insights from user sessions */
  questInsights: ModelConfig;
  /** Pipecat voice bot - real-time voice AI (configured via env var) */
  pipecatVoiceBot: ModelConfig;
}

/**
 * Default model configurations for each service
 * Optimized for free tier quota management
 */
export const AI_MODELS: ServiceModelConfig = {
  // Call processor: Uses flash-lite for best free tier quota (1000 RPD)
  callProcessor: {
    modelId: 'gemini-2.5-flash-lite',
    modelProvider: 'google',
    description: 'Fast model with highest free tier quota for call processing',
  },

  // Message API: Uses standard flash for balanced performance
  messageApi: {
    modelId: 'gemini-2.5-flash',
    modelProvider: 'google',
    description: 'Balanced model for real-time chat conversations',
  },

  // Quest insights: Uses standard flash for quality insights
  questInsights: {
    modelId: 'gemini-2.5-flash',
    modelProvider: 'google',
    description: 'Standard model for generating user session insights',
  },

  // Pipecat voice bot: Uses flash-lite for real-time voice (needs most quota)
  pipecatVoiceBot: {
    modelId: 'gemini-2.5-flash-lite',
    modelProvider: 'google',
    description: 'Fast model with highest quota for real-time voice processing',
  },
};

/**
 * Environment variable names for overriding models
 * These can be set in Lambda environment or .env files
 */
export const MODEL_ENV_VARS = {
  callProcessor: 'AI_MODEL_CALL_PROCESSOR',
  messageApi: 'AI_MODEL_MESSAGE_API',
  questInsights: 'AI_MODEL_QUEST_INSIGHTS',
  pipecatVoiceBot: 'GOOGLE_MODEL', // Pipecat uses this env var
} as const;

/**
 * Get model config for a service, with optional environment variable override
 */
export function getModelConfig(
  service: keyof ServiceModelConfig
): ModelConfig {
  const envVar = MODEL_ENV_VARS[service];
  const envValue = process.env[envVar];

  if (envValue) {
    return {
      modelId: envValue,
      modelProvider: AI_MODELS[service].modelProvider,
      description: `${AI_MODELS[service].description} (overridden via ${envVar})`,
    };
  }

  return AI_MODELS[service];
}

/**
 * Get modelInfo object for use with AiProviderService
 */
export function getModelInfo(service: keyof ServiceModelConfig): {
  modelId: string;
  modelProvider: string;
} {
  const config = getModelConfig(service);
  return {
    modelId: config.modelId,
    modelProvider: config.modelProvider,
  };
}
