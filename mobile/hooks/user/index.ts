// Composite User Hooks
// Combines Clerk user data with app-specific data

import { useUser } from '@clerk/clerk-expo';
import { useUserUsage } from '@/hooks/apis/useUser';

/**
 * Hook to get ONLY user profile data from Clerk (no usage data fetching)
 * Use this when you just need user info like displayName, email, avatar
 * This prevents unnecessary API calls for usage data
 */
export const useUserProfile = () => {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();

  return {
    // Clerk user data
    user,
    userLoaded,
    isSignedIn,

    // Computed values
    isAuthenticated: !!user && isSignedIn,

    // User profile helpers
    displayName: user?.fullName || user?.firstName || 'User',
    email: user?.primaryEmailAddress?.emailAddress || '',
    avatar: user?.imageUrl || '',
  };
};

/**
 * Composite hook that includes both user profile AND usage data
 * Use this only when you need both pieces of data
 */
export const useAppUser = () => {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { usage, loading: usageLoading, error: usageError, refetch: refetchUsage } = useUserUsage();

  return {
    // Clerk user data
    user,
    userLoaded,
    isSignedIn,

    // App-specific usage data
    usage,
    usageLoading,
    usageError,
    refetchUsage,

    // Computed values
    isAuthenticated: !!user && isSignedIn,
    hasUsageData: !!usage,

    // User profile helpers
    displayName: user?.fullName || user?.firstName || 'User',
    email: user?.primaryEmailAddress?.emailAddress || '',
    avatar: user?.imageUrl || '',
  };
};