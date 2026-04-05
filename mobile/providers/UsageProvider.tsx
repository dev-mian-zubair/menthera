import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { userApi, UserUsage, isApiSuccess } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

interface UsageContextType {
  usage: UserUsage | null;
  loading: boolean;
  error: string | null;

  // Core methods
  refetch: () => Promise<void>;

  // Quota checks (simplified — BYOK gate handles access)
  canSendMessage: () => boolean;
  canMakeCall: () => boolean;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

const STORAGE_KEY = '@menthera_usage_cache';
const SYNC_INTERVAL = 180000; // 3 minutes

export const UsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const fetchUsageRef = useRef<(() => Promise<void>) | undefined>(undefined);

  /**
   * Load cached usage from AsyncStorage
   */
  const loadCachedUsage = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsedUsage: UserUsage = JSON.parse(cached);
        // Convert date strings back to Date objects
        parsedUsage.resetDate = new Date(parsedUsage.resetDate);
        parsedUsage.createdAt = new Date(parsedUsage.createdAt);
        parsedUsage.lastUpdated = new Date(parsedUsage.lastUpdated);

        logger.debug('[UsageProvider] Loaded cached usage:', {
          plan: parsedUsage.plan,
          minutesRemaining: parsedUsage.minutes.remaining,
          messagesRemaining: parsedUsage.messages.remaining,
        });

        setUsage(parsedUsage);
        return parsedUsage;
      }
    } catch (err) {
      logger.error('[UsageProvider] Failed to load cached usage:', err);
    }
    return null;
  }, []);

  /**
   * Save usage to AsyncStorage for offline support
   */
  const cacheUsage = useCallback(async (usageData: UserUsage) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(usageData));
      logger.debug('[UsageProvider] Cached usage data');
    } catch (err) {
      logger.error('[UsageProvider] Failed to cache usage:', err);
    }
  }, []);

  /**
   * Fetch usage from backend
   */
  const fetchUsage = useCallback(async () => {
    if (!isSignedIn) {
      logger.debug('[UsageProvider] User not signed in, skipping fetch');
      setUsage(null);
      setError(null);
      setLoading(false);
      return;
    }

    logger.debug('[UsageProvider] 🔄 Fetching usage from backend... (loading: true)');
    setLoading(true);
    setError(null);

    try {
      const response = await userApi.getUsage();

      if (!isMountedRef.current) {
        logger.debug('[UsageProvider] Component unmounted, aborting');
        return;
      }

      logger.debug('[UsageProvider] 📦 Raw API response:', JSON.stringify(response, null, 2));

      if (isApiSuccess(response)) {
        logger.debug('[UsageProvider] ✓ Usage fetched successfully');
        logger.debug('[UsageProvider] 📊 Response data structure:', {
          plan: response.data.plan,
          minutesObject: response.data.minutes,
          messagesObject: response.data.messages,
          resetDate: response.data.resetDate,
        });

        logger.debug('[UsageProvider] 📋 Full usage data:', JSON.stringify(response.data, null, 2));

        setUsage(response.data);
        await cacheUsage(response.data);
        logger.debug('[UsageProvider] ✓ Usage state updated and cached');
      } else {
        logger.error('[UsageProvider] ✗ Failed to fetch usage:', response.error);
        setError(response.error);

        // Load cached data as fallback
        const cached = await loadCachedUsage();
        logger.debug('[UsageProvider] Loaded cached data as fallback:', !!cached);
      }
    } catch (err) {
      if (!isMountedRef.current) {
        logger.debug('[UsageProvider] Component unmounted during error handling');
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error('[UsageProvider] ✗ Exception:', errorMessage, err);
      setError(errorMessage);

      // Load cached data as fallback
      const cached = await loadCachedUsage();
      logger.debug('[UsageProvider] Loaded cached data after exception:', !!cached);
    } finally {
      if (isMountedRef.current) {
        logger.debug('[UsageProvider] ✓ Setting loading to false');
        setLoading(false);
      } else {
        logger.debug('[UsageProvider] Component unmounted, skipping loading state update');
      }
    }
  }, [isSignedIn, cacheUsage, loadCachedUsage]);

  // Keep ref in sync so effects can call the latest version without depending on it
  fetchUsageRef.current = fetchUsage;

  /**
   * Check if user can send a message (BYOK = always yes)
   */
  const canSendMessage = useCallback((): boolean => {
    return usage?.isByok === true;
  }, [usage]);

  /**
   * Check if user can make a call (BYOK = always yes)
   */
  const canMakeCall = useCallback((): boolean => {
    return usage?.isByok === true;
  }, [usage]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    logger.debug('[UsageProvider] Mount/update effect triggered:', { isLoaded, isSignedIn });

    if (isLoaded && isSignedIn) {
      logger.debug('[UsageProvider] User signed in - fetching usage');
      fetchUsageRef.current?.();
    } else if (isLoaded && !isSignedIn) {
      logger.debug('[UsageProvider] User not signed in - clearing usage');
      setUsage(null);
      setError(null);
    } else {
      logger.debug('[UsageProvider] Auth not loaded yet, waiting...');
    }
  }, [isLoaded, isSignedIn]);

  /**
   * Sync on app foreground
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isSignedIn) {
        logger.debug('[UsageProvider] App foregrounded - refreshing usage');
        fetchUsageRef.current?.();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isSignedIn]);

  /**
   * Periodic background sync (every 3 minutes)
   */
  useEffect(() => {
    if (isSignedIn) {
      logger.debug('[UsageProvider] Starting periodic sync (every 3 minutes)');

      syncIntervalRef.current = setInterval(() => {
        logger.debug('[UsageProvider] Periodic sync triggered');
        fetchUsageRef.current?.();
      }, SYNC_INTERVAL);

      return () => {
        if (syncIntervalRef.current) {
          logger.debug('[UsageProvider] Stopping periodic sync');
          clearInterval(syncIntervalRef.current);
          syncIntervalRef.current = null;
        }
      };
    }
  }, [isSignedIn]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  const value: UsageContextType = {
    usage,
    loading,
    error,
    refetch: fetchUsage,
    canSendMessage,
    canMakeCall,
  };

  return <UsageContext.Provider value={value}>{children}</UsageContext.Provider>;
};

/**
 * Hook to access usage context
 */
export const useUsage = (): UsageContextType => {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error('useUsage must be used within UsageProvider');
  }
  return context;
};
