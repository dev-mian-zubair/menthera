/**
 * EngagementProvider
 * Manages activity tracking, streaks, and recent activity state
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { logger } from '@/lib/utils/logger';
import {
  engagementApi,
  isApiSuccess,
  RecentActivity,
  StreakData,
  ActivityType,
  RecentActivityResponse,
  StreakResponse,
  AchievementsResponse,
  AchievementProgress,
  MilestoneResponse,
  Milestone,
  NewlyUnlockedAchievement,
} from '@/lib/api';

// ============================================
// TYPES
// ============================================

interface EngagementContextType {
  // State
  recentActivity: RecentActivity[];
  streak: StreakData | null;
  activeDays: number;
  totalInteractions: number;
  loading: boolean;
  error: string | null;

  // Achievements & Milestones
  achievements: AchievementProgress[];
  unlockedAchievements: AchievementProgress[];
  inProgressAchievements: AchievementProgress[];
  totalUnlocked: number;
  totalAchievements: number;
  nextMilestone: Milestone | null;
  upcomingMilestones: Milestone[];
  newlyUnlocked: NewlyUnlockedAchievement[];
  achievementsLoading: boolean;

  // Actions
  refetch: () => Promise<void>;
  refetchAchievements: () => Promise<void>;
  trackActivity: (activityType: ActivityType, agentId?: string, metadata?: Record<string, any>) => Promise<void>;
  clearNewlyUnlocked: () => void;
}

// ============================================
// CONTEXT
// ============================================

const EngagementContext = createContext<EngagementContextType | undefined>(undefined);

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY_RECENT = '@menthera_recent_activity';
const STORAGE_KEY_STREAKS = '@menthera_streaks';
const STORAGE_KEY_ACHIEVEMENTS = '@menthera_achievements';
const STORAGE_KEY_MILESTONES = '@menthera_milestones';
const SYNC_INTERVAL = 180000; // 3 minutes

// ============================================
// PROVIDER
// ============================================

export const EngagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  // State
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [activeDays, setActiveDays] = useState(0);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Achievements & Milestones State
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementProgress[]>([]);
  const [inProgressAchievements, setInProgressAchievements] = useState<AchievementProgress[]>([]);
  const [totalUnlocked, setTotalUnlocked] = useState(0);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [nextMilestone, setNextMilestone] = useState<Milestone | null>(null);
  const [upcomingMilestones, setUpcomingMilestones] = useState<Milestone[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<NewlyUnlockedAchievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);

  // Refs
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const fetchEngagementDataRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const fetchAchievementsDataRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const loadCachedDataRef = useRef<(() => Promise<void>) | undefined>(undefined);

  /**
   * Load cached data from AsyncStorage
   */
  const loadCachedData = useCallback(async () => {
    try {
      const [cachedRecent, cachedStreaks, cachedAchievements, cachedMilestones] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_RECENT),
        AsyncStorage.getItem(STORAGE_KEY_STREAKS),
        AsyncStorage.getItem(STORAGE_KEY_ACHIEVEMENTS),
        AsyncStorage.getItem(STORAGE_KEY_MILESTONES),
      ]);

      if (cachedRecent) {
        const parsed = JSON.parse(cachedRecent) as RecentActivityResponse;
        setRecentActivity(parsed.recentConversations || []);
        setActiveDays(parsed.summary?.activeDays || 0);
        setTotalInteractions(parsed.summary?.totalInteractions || 0);
        logger.debug('[EngagementProvider] Loaded cached recent activity:', parsed.recentConversations?.length || 0);
      }

      if (cachedStreaks) {
        const parsed = JSON.parse(cachedStreaks) as StreakResponse;
        setStreak(parsed.daily || null);
        logger.debug('[EngagementProvider] Loaded cached streak:', parsed.daily?.current || 0);
      }

      if (cachedAchievements) {
        const parsed = JSON.parse(cachedAchievements) as AchievementsResponse;
        setAchievements([...parsed.unlocked, ...parsed.inProgress, ...parsed.locked]);
        setUnlockedAchievements(parsed.unlocked || []);
        setInProgressAchievements(parsed.inProgress || []);
        setTotalUnlocked(parsed.totalUnlocked || 0);
        setTotalAchievements(parsed.totalAchievements || 0);
        logger.debug('[EngagementProvider] Loaded cached achievements:', parsed.totalUnlocked || 0);
      }

      if (cachedMilestones) {
        const parsed = JSON.parse(cachedMilestones) as MilestoneResponse;
        setNextMilestone(parsed.nextMilestone || null);
        setUpcomingMilestones(parsed.upcomingMilestones || []);
        logger.debug('[EngagementProvider] Loaded cached milestones:', parsed.nextMilestone?.id || 'none');
      }
    } catch (err) {
      logger.error('[EngagementProvider] Failed to load cached data:', err);
    }
  }, []);

  /**
   * Cache data to AsyncStorage
   */
  const cacheData = useCallback(async (recent: RecentActivityResponse, streaks: StreakResponse) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recent)),
        AsyncStorage.setItem(STORAGE_KEY_STREAKS, JSON.stringify(streaks)),
      ]);
      logger.debug('[EngagementProvider] Cached engagement data');
    } catch (err) {
      logger.error('[EngagementProvider] Failed to cache data:', err);
    }
  }, []);

  /**
   * Cache achievements and milestones data
   */
  const cacheAchievementsData = useCallback(async (achievementsData: AchievementsResponse, milestonesData: MilestoneResponse) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(achievementsData)),
        AsyncStorage.setItem(STORAGE_KEY_MILESTONES, JSON.stringify(milestonesData)),
      ]);
      logger.debug('[EngagementProvider] Cached achievements data');
    } catch (err) {
      logger.error('[EngagementProvider] Failed to cache achievements data:', err);
    }
  }, []);

  /**
   * Fetch achievements and milestones from backend
   */
  const fetchAchievementsData = useCallback(async () => {
    if (!isSignedIn) {
      logger.debug('[EngagementProvider] User not signed in, skipping achievements fetch');
      return;
    }

    logger.debug('[EngagementProvider] 🔄 Fetching achievements data...');
    setAchievementsLoading(true);

    try {
      // Fetch achievements and milestones in parallel
      const [achievementsResponse, milestonesResponse] = await Promise.all([
        engagementApi.getAchievements(),
        engagementApi.getMilestones(),
      ]);

      if (!isMountedRef.current) {
        logger.debug('[EngagementProvider] Component unmounted, aborting');
        return;
      }

      // Process achievements response
      if (isApiSuccess(achievementsResponse)) {
        const data = achievementsResponse.data;
        setAchievements([...data.unlocked, ...data.inProgress, ...data.locked]);
        setUnlockedAchievements(data.unlocked || []);
        setInProgressAchievements(data.inProgress || []);
        setTotalUnlocked(data.totalUnlocked || 0);
        setTotalAchievements(data.totalAchievements || 0);
        logger.debug('[EngagementProvider] ✓ Achievements loaded:', data.totalUnlocked || 0, 'unlocked');
      } else {
        logger.error('[EngagementProvider] ✗ Failed to load achievements:', achievementsResponse.error);
      }

      // Process milestones response
      if (isApiSuccess(milestonesResponse)) {
        const data = milestonesResponse.data;
        setNextMilestone(data.nextMilestone || null);
        setUpcomingMilestones(data.upcomingMilestones || []);
        logger.debug('[EngagementProvider] ✓ Milestones loaded, next:', data.nextMilestone?.id || 'none');
      } else {
        logger.error('[EngagementProvider] ✗ Failed to load milestones:', milestonesResponse.error);
      }

      // Cache the data
      if (isApiSuccess(achievementsResponse) && isApiSuccess(milestonesResponse)) {
        await cacheAchievementsData(achievementsResponse.data, milestonesResponse.data);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      logger.error('[EngagementProvider] ✗ Exception fetching achievements:', err);
    } finally {
      if (isMountedRef.current) {
        setAchievementsLoading(false);
      }
    }
  }, [isSignedIn, cacheAchievementsData]);

  /**
   * Clear newly unlocked achievements (after showing notification)
   */
  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  /**
   * Fetch engagement data from backend
   */
  const fetchEngagementData = useCallback(async () => {
    if (!isSignedIn) {
      logger.debug('[EngagementProvider] User not signed in, skipping fetch');
      setRecentActivity([]);
      setStreak(null);
      setActiveDays(0);
      setTotalInteractions(0);
      setError(null);
      setLoading(false);
      return;
    }

    logger.debug('[EngagementProvider] 🔄 Fetching engagement data...');
    setLoading(true);
    setError(null);

    try {
      // Fetch both recent activity and streaks in parallel
      const [recentResponse, streaksResponse] = await Promise.all([
        engagementApi.getRecentActivity(5),
        engagementApi.getStreaks(),
      ]);

      if (!isMountedRef.current) {
        logger.debug('[EngagementProvider] Component unmounted, aborting');
        return;
      }

      // Process recent activity response
      if (isApiSuccess(recentResponse)) {
        setRecentActivity(recentResponse.data.recentConversations || []);
        setActiveDays(recentResponse.data.summary?.activeDays || 0);
        setTotalInteractions(recentResponse.data.summary?.totalInteractions || 0);
        logger.debug('[EngagementProvider] ✓ Recent activity loaded:', recentResponse.data.recentConversations?.length || 0);
      } else {
        logger.error('[EngagementProvider] ✗ Failed to load recent activity:', recentResponse.error);
      }

      // Process streaks response
      if (isApiSuccess(streaksResponse)) {
        setStreak(streaksResponse.data.daily || null);
        logger.debug('[EngagementProvider] ✓ Streak loaded:', streaksResponse.data.daily?.current || 0);
      } else {
        logger.error('[EngagementProvider] ✗ Failed to load streaks:', streaksResponse.error);
      }

      // Cache the data
      if (isApiSuccess(recentResponse) && isApiSuccess(streaksResponse)) {
        await cacheData(recentResponse.data, streaksResponse.data);
      }

      // Set error if both failed
      if (!isApiSuccess(recentResponse) && !isApiSuccess(streaksResponse)) {
        setError('Failed to load engagement data');
        // Try to load cached data as fallback
        await loadCachedData();
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[EngagementProvider] ✗ Exception:', errorMessage);
      setError(errorMessage);

      // Load cached data as fallback
      await loadCachedData();
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isSignedIn, cacheData, loadCachedData]);

  // Keep refs in sync so effects can call the latest version without depending on them
  loadCachedDataRef.current = loadCachedData;
  fetchEngagementDataRef.current = fetchEngagementData;
  fetchAchievementsDataRef.current = fetchAchievementsData;

  /**
   * Track a user activity
   */
  const trackActivity = useCallback(async (
    activityType: ActivityType,
    agentId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!isSignedIn) {
      logger.debug('[EngagementProvider] Not signed in, skipping activity tracking');
      return;
    }

    try {
      logger.debug('[EngagementProvider] Tracking activity:', activityType, agentId);

      const response = await engagementApi.trackActivity({
        activityType,
        agentId,
        metadata,
      });

      if (isApiSuccess(response)) {
        // Optimistic update for streak
        if (response.data.streakUpdated) {
          setStreak(prev => prev ? {
            ...prev,
            current: response.data.streakUpdated!.daily,
          } : {
            current: response.data.streakUpdated!.daily,
            best: response.data.streakUpdated!.daily,
            lastActivityDate: new Date().toISOString().split('T')[0],
            startDate: new Date().toISOString().split('T')[0],
          });
        }

        // Check for new achievements
        const checkResponse = await engagementApi.checkAchievements();
        if (isApiSuccess(checkResponse) && checkResponse.data.count > 0) {
          setNewlyUnlocked(prev => [...prev, ...checkResponse.data.newlyUnlocked]);
          logger.debug('[EngagementProvider] 🎉 New achievements unlocked:', checkResponse.data.count);
        }

        // Refresh data in background (non-blocking)
        fetchEngagementData();
        fetchAchievementsData();

        logger.debug('[EngagementProvider] ✓ Activity tracked successfully');
      } else {
        logger.error('[EngagementProvider] ✗ Failed to track activity:', response.error);
      }
    } catch (err) {
      logger.error('[EngagementProvider] Exception tracking activity:', err);
      // Don't throw - activity tracking should be non-blocking
    }
  }, [isSignedIn, fetchEngagementData, fetchAchievementsData]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    logger.debug('[EngagementProvider] Mount/update effect:', { isLoaded, isSignedIn });

    if (isLoaded && isSignedIn) {
      // Load cached data first for instant display
      loadCachedDataRef.current?.();
      // Then fetch fresh data
      fetchEngagementDataRef.current?.();
      fetchAchievementsDataRef.current?.();
    } else if (isLoaded && !isSignedIn) {
      setRecentActivity([]);
      setStreak(null);
      setActiveDays(0);
      setTotalInteractions(0);
      setError(null);
      // Reset achievements state
      setAchievements([]);
      setUnlockedAchievements([]);
      setInProgressAchievements([]);
      setTotalUnlocked(0);
      setTotalAchievements(0);
      setNextMilestone(null);
      setUpcomingMilestones([]);
      setNewlyUnlocked([]);
    }
  }, [isLoaded, isSignedIn]);

  /**
   * Sync on app foreground
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isSignedIn) {
        logger.debug('[EngagementProvider] App foregrounded - refreshing');
        fetchEngagementDataRef.current?.();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isSignedIn]);

  /**
   * Periodic background sync
   */
  useEffect(() => {
    if (isSignedIn) {
      logger.debug('[EngagementProvider] Starting periodic sync');

      syncIntervalRef.current = setInterval(() => {
        logger.debug('[EngagementProvider] Periodic sync triggered');
        fetchEngagementDataRef.current?.();
      }, SYNC_INTERVAL);

      return () => {
        if (syncIntervalRef.current) {
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

  const value: EngagementContextType = {
    recentActivity,
    streak,
    activeDays,
    totalInteractions,
    loading,
    error,
    // Achievements & Milestones
    achievements,
    unlockedAchievements,
    inProgressAchievements,
    totalUnlocked,
    totalAchievements,
    nextMilestone,
    upcomingMilestones,
    newlyUnlocked,
    achievementsLoading,
    // Actions
    refetch: fetchEngagementData,
    refetchAchievements: fetchAchievementsData,
    trackActivity,
    clearNewlyUnlocked,
  };

  return (
    <EngagementContext.Provider value={value}>
      {children}
    </EngagementContext.Provider>
  );
};

// ============================================
// HOOKS
// ============================================

/**
 * Hook to access engagement context
 */
export const useEngagement = (): EngagementContextType => {
  const context = useContext(EngagementContext);
  if (!context) {
    throw new Error('useEngagement must be used within EngagementProvider');
  }
  return context;
};
