import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';

/**
 * Hook that configures the Clerk authentication token in the API client.
 * Properly handles token fetching within React context.
 *
 * IMPORTANT: The token is fetched using Clerk's default session token (not a custom template).
 * Your backend auth middleware must accept this token format.
 */
export const useClerkToken = () => {
  const { getToken, userId, isLoaded } = useAuth();

  useEffect(() => {
    logger.debug('[Clerk Token] Hook mounted/updated', { isLoaded, userId, hasGetToken: !!getToken });

    if (!isLoaded || !userId) {
      logger.debug('[Clerk Token] ⏳ Not ready yet', { isLoaded, userId });
      apiClient.setTokenGetter(async () => null);
      return;
    }

    logger.debug('[Clerk Token] ✓ Configuring token getter', { userId });

    // Store the getToken function for use in token getter
    // This ensures getToken is called within React context
    apiClient.setTokenGetter(async () => {
      try {
        logger.debug('[Clerk Token] Fetching token from session...');
        // Call getToken() with no options to get the default session token
        // This works with Clerk's auth middleware (@hono/clerk-auth)
        const token = await getToken();

        if (!token) {
          logger.warn('[Clerk Token] ⚠ getToken() returned null - session may not be fully initialized');
          // Try again after a small delay to allow Clerk state to settle
          await new Promise(resolve => setTimeout(resolve, 100));
          const retryToken = await getToken();
          if (retryToken) {
            logger.debug('[Clerk Token] ✓ Token fetched on retry', {
              length: retryToken.length,
              parts: retryToken.split('.').length,
            });
            return retryToken;
          }
          return null;
        }

        logger.debug('[Clerk Token] ✓ Token fetched successfully', {
          length: token.length,
          parts: token.split('.').length,
        });
        return token;
      } catch (error) {
        logger.error('[Clerk Token] ✗ Failed to get token:', error);
        return null;
      }
    });

    return () => {
      // Clean up on unmount
      logger.debug('[Clerk Token] Cleaning up token getter on unmount');
      apiClient.setTokenGetter(async () => null);
    };
  }, [getToken, userId, isLoaded]);
};
