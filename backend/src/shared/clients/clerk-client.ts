import { createClerkClient } from '@clerk/backend';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * Service for managing Clerk users via Clerk Backend API
 * Handles lazy initialization and provides methods to update user metadata
 */
export class ClerkClient {
  private static client: ReturnType<typeof createClerkClient> | null = null;
  private static secretKey: string | null = null;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Lazy initialization of Clerk client with singleton pattern
   */
  private static async initialize(): Promise<void> {
    // If already initializing, wait for that to complete
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If already initialized, return immediately
    if (this.client) {
      return;
    }

    // Start initialization
    this.initializationPromise = (async () => {
      try {
        if (!this.secretKey) {
          this.secretKey = await this.getSecretKey();
        }

        if (!this.secretKey) {
          throw new Error('CLERK_SECRET_KEY not found in secrets');
        }

        this.client = createClerkClient({ secretKey: this.secretKey });
        console.log('[ClerkClient] Successfully initialized');
      } catch (error) {
        console.error('[ClerkClient] Failed to initialize:', error);
        this.client = null;
        throw error;
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Get Clerk secret key from AWS Secrets Manager
   */
  private static async getSecretKey(): Promise<string | null> {
    try {
      const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
      const response = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: process.env.APP_SECRET_NAME })
      );

      const secrets = JSON.parse(response.SecretString || '{}');
      return secrets.CLERK_SECRET_KEY || null;
    } catch (error) {
      console.error('[ClerkClient] Failed to get secret key:', error);
      return null;
    }
  }

  /**
   * Get initialized client instance
   */
  private static async getClient(): Promise<ReturnType<typeof createClerkClient> | null> {
    try {
      await this.initialize();
      return this.client;
    } catch (error) {
      console.error('[ClerkClient] Failed to get client:', error);
      return null;
    }
  }

  /**
   * Update user's public metadata
   *
   * @param userId - Clerk user ID
   * @param metadata - Partial metadata to merge with existing metadata
   * @returns true if successful, false otherwise
   *
   * @example
   * const success = await ClerkClient.updatePublicMetadata('user_123', {
   *   hasCompletedOnboarding: true,
   *   selectedTier: 'premium'
   * });
   */
  static async updatePublicMetadata(
    userId: string,
    metadata: Record<string, any>
  ): Promise<boolean> {
    const client = await this.getClient();
    if (!client) {
      console.warn('[ClerkClient] Client not initialized');
      return false;
    }

    try {
      console.log('[ClerkClient] Updating public metadata for user:', userId, metadata);

      await client.users.updateUser(userId, {
        publicMetadata: metadata,
      });

      console.log('[ClerkClient] Successfully updated public metadata');
      return true;
    } catch (error) {
      console.error('[ClerkClient] Failed to update public metadata:', error);
      return false;
    }
  }
}
