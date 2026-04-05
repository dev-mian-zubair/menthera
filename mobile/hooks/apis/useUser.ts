import { useState, useEffect, useCallback } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { userApi, UserUsage } from '@/lib/api';
import { isApiSuccess } from '@/lib/api/config';
import { logger } from '@/lib/utils/logger';

export const useUserUsage = () => {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    logger.debug('[useUserUsage] 🔄 Starting usage data fetch...');
    setLoading(true);
    setError(null);

    try {
      const response = await userApi.getUsage();

      if (isApiSuccess(response)) {
        logger.debug('[useUserUsage] ✓ Usage data fetched successfully:', {
          plan: response.data.plan,
          minutesUsed: response.data.minutes.used,
          messagesUsed: response.data.messages.used,
        });
        setUsage(response.data);
      } else {
        logger.error('[useUserUsage] ✗ Error response:', response.error);
        setError(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error('[useUserUsage] ✗ Exception:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch if user is signed in
    if (isLoaded && isSignedIn) {
      logger.debug('[useUserUsage] ✓ User is signed in, fetching usage data');
      fetchUsage();
    } else if (isLoaded && !isSignedIn) {
      // User is not signed in - clear data
      logger.debug('[useUserUsage] 🚫 User is not signed in, skipping fetch');
      setUsage(null);
      setError(null);
    }
  }, [isLoaded, isSignedIn, fetchUsage]);

  const refetch = useCallback(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    usage,
    loading,
    error,
    refetch,
  };
};


export const useUserActions = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await userApi.deleteAccount();

      if (isApiSuccess(response)) {
        // Delete from Clerk after backend deletion (best-effort)
        try {
          await user?.delete();
        } catch (clerkErr) {
          logger.warn('[useUserActions] Clerk deletion failed (backend data already deleted):', clerkErr);
        }
        return true;
      } else {
        setError(response.error);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    deleteAccount, // Calls backend API + Clerk deletion
    loading,
    error,
  };
};