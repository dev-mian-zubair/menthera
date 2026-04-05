/**
 * Universal OAuth Hook
 * Handles Google and Apple OAuth authentication
 * Works for both sign-in and sign-up cases
 *
 * IMPORTANT: This hook ONLY activates the session.
 * The AuthGuard component handles all routing based on auth state changes.
 * Do NOT call router.replace() here - it runs before setActive() completes.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSSO, useSignIn } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { logger } from '@/lib/utils/logger';

// Required to complete OAuth callback
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'apple' | 'google';

interface UseOAuthReturn {
  handleOAuth: (provider: OAuthProvider) => Promise<void>;
  isLoading: boolean;
  loadingProvider: OAuthProvider | null;
  error: string | null;
}

export const useOAuth = (): UseOAuthReturn => {
  const { startSSOFlow } = useSSO();
  const { setActive } = useSignIn();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectScheme = process.env.EXPO_PUBLIC_REDIRECT_SCHEME || '';

  const handleOAuth = useCallback(
    async (provider: OAuthProvider) => {
      if (!redirectScheme) {
        setError('OAuth redirect scheme not configured');
        return;
      }

      if (!startSSOFlow || !setActive) {
        setError('Authentication service not available');
        return;
      }

      setIsLoading(true);
      setLoadingProvider(provider);
      setError(null);

      try {
        const strategy = provider === 'apple' ? 'oauth_apple' : 'oauth_google';

        // Create redirect URL for OAuth callback
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: redirectScheme,
          path: 'oauth',
          preferLocalhost: process.env.EXPO_PUBLIC_PREFER_LOCALHOST === 'true',
        });

        logger.debug('[useOAuth] 🔗 OAuth Configuration:', {
          provider,
          strategy,
          redirectUrl,
          redirectScheme,
        });

        // Start SSO flow with Clerk
        const result = await startSSOFlow({
          strategy,
          redirectUrl,
        });

        const { createdSessionId, signUp, signIn: signInResult } = result;

        logger.debug('[useOAuth] ✓ OAuth result received:', {
          hasCreatedSessionId: !!createdSessionId,
          signInStatus: signInResult?.status,
          signUpStatus: signUp?.status,
          isExistingUser: !!signInResult?.status,
          isNewUser: !!signUp?.createdUserId,
        });

        // Check if user cancelled authentication
        if (!signInResult && !signUp) {
          logger.debug('[useOAuth] User cancelled OAuth');
          setIsLoading(false);
          setLoadingProvider(null);
          return;
        }

        // Handle incomplete signup - fill missing required fields
        // This prevents the "You're signing back in" loop
        if (signUp && !createdSessionId) {
          logger.debug('[useOAuth] ⚠️ Signup incomplete, filling required fields...');

          try {
            // If email is missing, use a generated one from the OAuth provider
            const email = signUp.emailAddress || `user-${Date.now()}@oauth.local`;

            const updatedSignUp = await signUp.update({
              username: email.split('@')[0],
              // Clerk Expo handles email/name from OAuth automatically
            });

            logger.debug('[useOAuth] ✓ Signup updated, status:', updatedSignUp?.status);

            if (updatedSignUp?.createdSessionId) {
              await setActive({ session: updatedSignUp.createdSessionId });
              logger.debug('[useOAuth] ✓ Session activated for new user');
            }
          } catch (updateErr) {
            logger.error('[useOAuth] Error completing signup:', updateErr);
            setError('Failed to complete registration. Please try again.');
            setIsLoading(false);
            setLoadingProvider(null);
            return;
          }

          // Don't navigate - AuthGuard will handle it
          return;
        }

        // Main path: We have a valid session ID
        if (createdSessionId) {
          logger.debug('[useOAuth] 🔐 Activating session...');
          try {
            await setActive({ session: createdSessionId });
            logger.debug('[useOAuth] ✓ Session activated successfully');
            // STOP HERE - Do not navigate or log after this
            // The AuthGuard component will detect the auth state change
            // and route the user appropriately
          } catch (activateErr) {
            logger.error('[useOAuth] Error activating session:', activateErr);
            setError('Failed to activate session. Please try again.');
          }

          // Exit without navigating
          // AuthGuard will handle routing when it detects userId is now set
          return;
        }

        // Should not reach here
        logger.warn('[useOAuth] No session ID and signup incomplete');
        setError('Authentication could not be completed. Please try again.');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `${provider} authentication failed`;
        logger.error('[useOAuth] OAuth error:', errorMessage, err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        setLoadingProvider(null);
      }
    },
    [startSSOFlow, setActive, redirectScheme],
  );

  // Warm up browser resources for faster OAuth flows
  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  return {
    handleOAuth,
    isLoading,
    loadingProvider,
    error,
  };
};
