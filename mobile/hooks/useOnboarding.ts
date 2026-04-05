import { useState, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { API_CONFIG } from '@/lib/api/config';
import { logger } from '@/lib/utils/logger';

export interface OnboardingAnswers {
  selectedAgentId?: string;
  age?: string;
  gender?: string;
  goals?: string[];
  interests?: string[];
  preferredCoachingStyle?: string;
  preferredLanguage?: string;
  [key: string]: any; // Allow additional fields
}

export const useOnboarding = () => {
  const { user, isLoaded } = useUser();
  const { userId } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has completed onboarding
  const hasCompletedOnboarding = user?.publicMetadata?.hasCompletedOnboarding === true;

  // Submit onboarding answers to backend
  const submitOnboarding = useCallback(async (answers: OnboardingAnswers): Promise<boolean> => {
    logger.debug('[useOnboarding] Submit called', { isLoaded, hasUser: !!user, userId });

    if (!isLoaded) {
      setError('Authentication still loading, please wait...');
      logger.error('[useOnboarding] Clerk not loaded yet');
      return false;
    }

    if (!userId) {
      // User session is not available - this means they need to sign in again
      // This can happen if the session expired during onboarding
      setError('Your session has expired. Please sign in again to complete onboarding.');
      logger.error('[useOnboarding] No userId available - session expired or user not authenticated');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      logger.debug('[useOnboarding] Submitting onboarding answers to backend...', { userId });

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || API_CONFIG.BASE_URL;
      const url = `${baseUrl}/users/onboarding`;

      const response = await authenticatedFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to submit onboarding: ${response.status}`);
      }

      logger.debug('[useOnboarding] Onboarding answers submitted successfully');

      // Note: Clerk publicMetadata will be updated by the backend through Clerk Backend SDK
      // or webhook. For now, the onboarding screen will navigate immediately after this success.

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit onboarding';
      logger.error('[useOnboarding] Error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, authenticatedFetch, isLoaded]);

  // Skip onboarding manually (for testing or special cases)
  // Note: Uses unsafeMetadata because publicMetadata is read-only on client.
  // The check for hasCompletedOnboarding in this file uses publicMetadata,
  // so this skip only works for testing. Production skips should go through backend.
  const skipOnboarding = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          hasCompletedOnboarding: true,
        },
      });
      return true;
    } catch (err) {
      logger.error('[useOnboarding] Failed to skip onboarding:', err);
      return false;
    }
  }, [user]);

  return {
    isLoaded,
    hasCompletedOnboarding,
    isSubmitting,
    error,
    submitOnboarding,
    skipOnboarding,
  };
};
