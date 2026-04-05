/**
 * Use Authenticated Fetch Hook
 * Returns a fetch function that automatically injects Clerk JWT token
 *
 * This hook ensures the Clerk session is ready before making requests.
 * Call getToken() at request time, not at initialization time.
 *
 * Usage:
 * const authenticatedFetch = useAuthenticatedFetch();
 * const response = await authenticatedFetch('/api/endpoint', { method: 'POST' });
 */
import { useAuth } from '@clerk/clerk-expo';
import { useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

export const useAuthenticatedFetch = () => {
  const { getToken, userId } = useAuth();

  const authenticatedFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      logger.debug('[useAuthenticatedFetch] Starting request:', { url, userId });

      // Get token at request time (not at hook init time)
      // This ensures Clerk session is ready
      let token: string | null = null;
      try {
        logger.debug('[useAuthenticatedFetch] Calling getToken()...');
        token = await getToken();
        logger.debug('[useAuthenticatedFetch] getToken() returned:', {
          hasToken: !!token,
          tokenLength: token?.length || 0,
        });
      } catch (error) {
        logger.warn('[useAuthenticatedFetch] Failed to get token:', error);
      }

      const headers = new Headers(init?.headers);

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
        logger.debug('[useAuthenticatedFetch] ✓ Token added to request');
      } else {
        logger.warn('[useAuthenticatedFetch] ⚠ No token available');
      }

      logger.debug('[useAuthenticatedFetch] Making request with headers:', {
        hasAuth: headers.has('Authorization'),
        headerKeys: Array.from(headers.keys()),
      });

      return fetch(input, {
        ...init,
        headers,
      });
    },
    [getToken, userId]
  );

  return authenticatedFetch;
};
