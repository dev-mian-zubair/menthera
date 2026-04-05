import { LanguageModelV2 } from '@ai-sdk/provider';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { AppSecrets } from '../utils/secrets-helper';

/**
 * AiProviderService
 *
 * Abstraction layer for LLM provider instantiation.
 * Google models always use the user's BYOK key (no system key fallback).
 * Anthropic/OpenAI still use system secrets.
 */
export class AiProviderService {
  public static new({
    secrets,
  }: { secrets?: AppSecrets } = {}): AiProviderService {
    return new AiProviderService(secrets);
  }

  private constructor(private secrets?: AppSecrets) {}

  /**
   * Get an AI model instance based on provider and model ID.
   * For Google models, userApiKey is required.
   */
  async getAiProvider({
    modelInfo,
    secrets,
    userApiKey,
  }: {
    modelInfo: {
      modelId: string;
      modelProvider: string;
    };
    secrets?: AppSecrets;
    userApiKey?: string;
  }): Promise<LanguageModelV2> {
    switch (modelInfo.modelProvider) {
      case 'google': {
        if (!userApiKey) {
          throw new Error('User API key is required for Google models (BYOK)');
        }
        console.log('[AiProvider] Using user BYOK key for Google model');
        const google = createGoogleGenerativeAI({ apiKey: userApiKey });
        return google(modelInfo.modelId);
      }

      case 'anthropic': {
        const activeSecrets = secrets ?? this.secrets;
        if (!activeSecrets?.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY not found in secrets');
        }
        const anthropic = createAnthropic({ apiKey: activeSecrets.ANTHROPIC_API_KEY });
        return anthropic(modelInfo.modelId);
      }

      case 'openai': {
        const activeSecrets = secrets ?? this.secrets;
        if (!activeSecrets?.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY not found in secrets');
        }
        const openai = createOpenAI({ apiKey: activeSecrets.OPENAI_API_KEY });
        return openai(modelInfo.modelId);
      }

      default:
        throw new Error(
          `Invalid model provider: ${modelInfo.modelProvider}. Supported providers: 'anthropic', 'openai', 'google'`
        );
    }
  }

  /**
   * Static method for backward compatibility - Get Anthropic model directly
   *
   * @deprecated Use getAiProvider() with factory pattern instead
   */
  static getAnthropicModel(
    modelId: string,
    secrets: AppSecrets
  ): LanguageModelV2 {
    if (!secrets.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in secrets');
    }

    const anthropic = createAnthropic({
      apiKey: secrets.ANTHROPIC_API_KEY,
    });

    return anthropic(modelId);
  }
}
