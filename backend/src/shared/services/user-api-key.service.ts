import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

export interface ApiKeyInfo {
  hasKey: boolean;
  keyPrefix?: string;
  keySuffix?: string;
  validatedAt?: string;
}

export class UserApiKeyService {
  constructor(
    private db: DynamoDBDocumentClient,
    private tableName: string
  ) {}

  /**
   * Get the user's stored API key.
   * Returns null if user has no key stored.
   */
  async getUserApiKey(userId: string): Promise<string | null> {
    const result = await this.db.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { user_id: userId },
        ProjectionExpression: 'byokApiKey',
      })
    );

    if (!result.Item) return null;
    return result.Item.byokApiKey || null;
  }

  /**
   * Validate a Google Gemini API key by listing models (zero tokens, fast).
   * Returns true if the key is valid and has access.
   */
  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    // Format check
    if (!apiKey || !apiKey.startsWith('AIza') || apiKey.length < 30) {
      return { valid: false, error: 'Invalid key format. Gemini API keys start with "AIza" and are at least 30 characters.' };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { method: 'GET', signal: AbortSignal.timeout(10000) }
      );

      if (response.ok) {
        return { valid: true };
      }

      if (response.status === 400 || response.status === 403) {
        return { valid: false, error: 'API key is invalid or does not have access to Gemini models.' };
      }

      return { valid: false, error: `Validation failed with status ${response.status}. Please try again.` };
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        return { valid: false, error: 'Validation request timed out. Please try again.' };
      }
      return { valid: false, error: 'Could not reach Google API to validate key. Please try again.' };
    }
  }

  /**
   * Validate and store a user's BYOK API key.
   * Sets byokApiKey, byokKeyPrefix, and byokKeyValidatedAt on the user record.
   */
  async storeApiKey(userId: string, apiKey: string): Promise<{ stored: boolean; error?: string }> {
    const validation = await this.validateApiKey(apiKey);
    if (!validation.valid) {
      return { stored: false, error: validation.error };
    }

    const keyPrefix = apiKey.substring(0, 8);
    const keySuffix = apiKey.substring(apiKey.length - 4);

    await this.db.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { user_id: userId },
        UpdateExpression: 'SET byokApiKey = :key, byokKeyPrefix = :prefix, byokKeySuffix = :suffix, byokKeyValidatedAt = :validatedAt, lastUpdated = :now',
        ExpressionAttributeValues: {
          ':key': apiKey,
          ':prefix': keyPrefix,
          ':suffix': keySuffix,
          ':validatedAt': new Date().toISOString(),
          ':now': new Date().toISOString(),
        },
      })
    );

    return { stored: true };
  }

  /**
   * Remove a user's stored BYOK API key fields.
   */
  async removeApiKey(userId: string): Promise<void> {
    await this.db.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { user_id: userId },
        UpdateExpression: 'REMOVE byokApiKey, byokKeyPrefix, byokKeySuffix, byokKeyValidatedAt SET lastUpdated = :now',
        ExpressionAttributeValues: {
          ':now': new Date().toISOString(),
        },
      })
    );
  }

  /**
   * Get masked key info for display. Never returns the full key.
   */
  async getKeyInfo(userId: string): Promise<ApiKeyInfo> {
    const result = await this.db.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { user_id: userId },
        ProjectionExpression: 'byokApiKey, byokKeyPrefix, byokKeySuffix, byokKeyValidatedAt',
      })
    );

    if (!result.Item?.byokApiKey) {
      return { hasKey: false };
    }

    return {
      hasKey: true,
      keyPrefix: result.Item.byokKeyPrefix,
      keySuffix: result.Item.byokKeySuffix,
      validatedAt: result.Item.byokKeyValidatedAt,
    };
  }
}
