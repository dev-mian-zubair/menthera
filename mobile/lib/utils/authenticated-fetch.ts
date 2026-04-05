/**
 * Authenticated fetch wrapper (non-hook version for use in providers)
 * Wraps the native fetch to automatically inject Clerk JWT token
 *
 * NOTE: This is a fallback for non-hook contexts.
 * For React components, prefer using useAuthenticatedFetch() hook instead.
 */
import { apiClient } from '@/lib/api/client';
import { logger } from './logger';

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  // Get auth token from apiClient's token getter
  const apiClientAny = apiClient as any;
  if (apiClientAny.tokenGetter) {
    try {
      const token = await apiClientAny.tokenGetter();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (error) {
      logger.warn('[AuthenticatedFetch] Failed to get auth token:', error);
    }
  }

  // Make the request with auth token injected
  return fetch(input, {
    ...init,
    headers,
  });
}
