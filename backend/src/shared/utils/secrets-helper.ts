import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export interface AppSecrets {
  // Authentication
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;

  // Webhooks
  CLERK_WEBHOOK_SECRET: string;
  REVENUECAT_WEBHOOK_SECRET: string;

  // AI Services (non-Google — Google keys come from user BYOK)
  ELEVENLABS_API_KEY: string;
  MEM0_API_KEY: string;

  // Communication
  DAILY_API_KEY: string;
  CARTESIA_API_KEY: string;

  // Optional AI Services
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

export class SecretsHelper {
  private static client = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  private static cache: { secrets: AppSecrets; expiry: number } | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all application secrets
   */
  public static async getAppSecrets(): Promise<AppSecrets> {
    // Use provided ARN or get from environment
    const secretId = process.env.APP_SECRET_NAME || '';

    if (!secretId) {
      throw new Error('Secret name not provided and APP_SECRET_NAME environment variable not set');
    }

    // Check cache first
    if (this.cache && Date.now() < this.cache.expiry) {
      return this.cache.secrets;
    }

    try {
      const command = new GetSecretValueCommand({
        SecretId: secretId,
      });

      const response = await this.client.send(command);

      if (!response.SecretString) {
        throw new Error(`Secret ${secretId} has no string value`);
      }

      const secrets = JSON.parse(response.SecretString) as AppSecrets;

      // Validate required secrets
      this.validateRequiredSecrets(secrets);

      // Cache the result
      this.cache = {
        secrets,
        expiry: Date.now() + this.CACHE_DURATION,
      };

      return secrets;
    } catch (error) {
      console.error(`Failed to retrieve app secrets:`, error);
      throw new Error(`Failed to retrieve app secrets: ${error}`);
    }
  }

  /**
   * Get a specific secret value by key
   */
  public static async getSecretValue(key: keyof AppSecrets): Promise<string> {
    const secrets = await this.getAppSecrets();
    const value = secrets[key];

    if (!value) {
      throw new Error(`Secret key '${key}' not found or empty`);
    }

    return value;
  }

  /**
   * Check if all required secrets are available
   */
  public static async hasRequiredSecrets(): Promise<boolean> {
    try {
      await this.getAppSecrets();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear cache (useful for testing or forcing refresh)
   */
  public static clearCache(): void {
    this.cache = null;
  }

  /**
   * Validate that required secrets are present and not placeholder values
   */
  private static validateRequiredSecrets(secrets: AppSecrets): void {
    const requiredKeys: (keyof AppSecrets)[] = [
      'CLERK_SECRET_KEY',
      'ELEVENLABS_API_KEY',
      'DAILY_API_KEY',
    ];

    const missingOrInvalidSecrets: string[] = [];

    for (const key of requiredKeys) {
      const value = secrets[key];
      if (!value || value.startsWith('REPLACE_WITH_ACTUAL_')) {
        missingOrInvalidSecrets.push(key);
      }
    }

    if (missingOrInvalidSecrets.length > 0) {
      throw new Error(
        `Missing or invalid secrets: ${missingOrInvalidSecrets.join(', ')}. ` +
        'Please update the secrets in AWS Secrets Manager.'
      );
    }
  }
}
