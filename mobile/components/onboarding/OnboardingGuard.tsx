import React, { useEffect, useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { router, usePathname, useSegments } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useOnboarding } from '@/hooks/useOnboarding';
import { logger } from '@/lib/utils/logger';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * OnboardingGuard - Redirects users to onboarding if they haven't completed it
 * Place this component after AuthGuard in the component tree
 */
export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const theme = useMemo(() => getTimeTheme(), []);
  const { isLoaded, hasCompletedOnboarding } = useOnboarding();
  const { userId, isLoaded: authLoaded } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded || !authLoaded) {
      return;
    }

    const inOnboarding = segments[0] === 'onboarding';

    logger.debug('[OnboardingGuard] Check:', {
      pathname,
      segments,
      hasCompletedOnboarding,
      inOnboarding,
      userId: userId || 'null',
      authLoaded,
    });

    // IMPORTANT: Only check onboarding for authenticated users
    // If user is not signed in, skip all onboarding checks - AuthGuard handles routing
    if (!userId) {
      logger.debug('[OnboardingGuard] User not authenticated, skipping onboarding checks (AuthGuard will handle routing)');
      return;
    }

    // User is authenticated - now check onboarding status

    // If user hasn't completed onboarding and is not already in onboarding flow
    if (!hasCompletedOnboarding && !inOnboarding) {
      logger.debug('[OnboardingGuard] Redirecting to onboarding...');
      router.replace('/onboarding');
    }

    // If user has completed onboarding but is still in onboarding flow
    if (hasCompletedOnboarding && inOnboarding) {
      logger.debug('[OnboardingGuard] Onboarding completed, redirecting to home...');
      router.replace('/(tabs)');
    }
  }, [isLoaded, authLoaded, hasCompletedOnboarding, userId, segments, pathname]);

  // Show loading while checking onboarding status and auth
  if (!isLoaded || !authLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.subtitleColor} />
      </View>
    );
  }

  return <>{children}</>;
};
