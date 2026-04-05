/**
 * Engagement API Module
 * Handles activity tracking, streaks, and recent activity
 */

import { apiClient } from './client';
import { ApiResponse, isApiSuccess } from './config';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export type ActivityType = 'message' | 'call' | 'quest_start' | 'quest_complete' | 'login';

export interface RecentActivity {
  agentId: string;
  agentName?: string;
  lastInteractionDate: string;
  activityType: ActivityType;
  interactionCount7Days: number;
}

export interface RecentActivityResponse {
  recentConversations: RecentActivity[];
  summary: {
    totalInteractions: number;
    activeDays: number;
  };
}

export interface StreakData {
  current: number;
  best: number;
  lastActivityDate: string;
  startDate: string;
}

export interface StreakResponse {
  daily: StreakData;
  perAgent: Array<{
    agentId: string;
    current: number;
    best: number;
  }>;
}

export interface TrackActivityRequest {
  activityType: ActivityType;
  agentId?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

export interface TrackActivityResponse {
  activityId: string;
  userId: string;
  timestamp: string;
  streakUpdated?: {
    daily: number;
    agent?: number;
  };
}

export interface ActivitySummary {
  totalActivities: number;
  activeDaysLast7: number;
  activeDaysLast30: number;
  byType: Record<ActivityType, number>;
  byAgent: Record<string, number>;
  currentStreak: number;
  bestStreak: number;
}

// ============================================
// ACHIEVEMENTS TYPES
// ============================================

export type AchievementCategory = 'messaging' | 'calls' | 'streaks' | 'quests' | 'engagement';

export interface AchievementProgress {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  progress: number; // 0-100
  isUnlocked: boolean;
  unlockDate?: string;
  hidden?: boolean;
}

export interface AchievementsResponse {
  unlocked: AchievementProgress[];
  inProgress: AchievementProgress[];
  locked: AchievementProgress[];
  totalUnlocked: number;
  totalAchievements: number;
}

export interface NewlyUnlockedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface CheckAchievementsResponse {
  newlyUnlocked: NewlyUnlockedAchievement[];
  count: number;
}

export interface Milestone {
  id: string;
  type: 'message_count' | 'call_count' | 'streak' | 'quest' | 'engagement';
  target: number;
  current: number;
  progress: number; // 0-100
  reward: string;
  icon: string;
  completed: boolean;
}

export interface MilestoneResponse {
  nextMilestone?: Milestone;
  upcomingMilestones: Milestone[];
  completedMilestones: Milestone[];
}

export interface UserStats {
  totalMessages: number;
  totalCalls: number;
  totalCallMinutes: number;
  currentStreak: number;
  bestStreak: number;
  questsCompleted: number;
  questsStarted: number;
  totalActiveDays: number;
  agentsEngaged: number;
}

// ============================================
// API FUNCTIONS
// ============================================

export const engagementApi = {
  /**
   * Track a user activity
   */
  async trackActivity(request: TrackActivityRequest): Promise<ApiResponse<TrackActivityResponse>> {
    try {
      logger.debug('[engagementApi] Tracking activity:', request.activityType);
      const response = await apiClient.post<TrackActivityResponse>('/engagement/activity', request);

      if (isApiSuccess(response)) {
        logger.debug('[engagementApi] ✓ Activity tracked:', response.data.activityId);
      } else {
        logger.error('[engagementApi] ✗ Failed to track activity:', response.error);
      }

      return response;
    } catch (error) {
      logger.error('[engagementApi] Exception tracking activity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track activity',
      };
    }
  },

  /**
   * Get recent activity for continue conversation feature
   */
  async getRecentActivity(limit: number = 5): Promise<ApiResponse<RecentActivityResponse>> {
    try {
      logger.debug('[engagementApi] Fetching recent activity, limit:', limit);
      const response = await apiClient.get<RecentActivityResponse>('/engagement/recent', { limit });

      if (isApiSuccess(response)) {
        logger.debug('[engagementApi] ✓ Recent activity fetched:', response.data.recentConversations.length, 'conversations');
      } else {
        logger.error('[engagementApi] ✗ Failed to fetch recent activity:', response.error);
      }

      return response;
    } catch (error) {
      logger.error('[engagementApi] Exception fetching recent activity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch recent activity',
      };
    }
  },

  /**
   * Get streak data
   */
  async getStreaks(): Promise<ApiResponse<StreakResponse>> {
    try {
      logger.debug('[engagementApi] Fetching streaks');
      const response = await apiClient.get<StreakResponse>('/engagement/streaks');

      if (isApiSuccess(response)) {
        logger.debug('[engagementApi] ✓ Streaks fetched, daily:', response.data.daily.current);
      } else {
        logger.error('[engagementApi] ✗ Failed to fetch streaks:', response.error);
      }

      return response;
    } catch (error) {
      logger.error('[engagementApi] Exception fetching streaks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch streaks',
      };
    }
  },

  /**
   * Get activity summary
   */
  async getSummary(): Promise<ApiResponse<ActivitySummary>> {
    try {
      logger.debug('[engagementApi] Fetching activity summary');
      const response = await apiClient.get<ActivitySummary>('/engagement/summary');

      if (isApiSuccess(response)) {
        logger.debug('[engagementApi] ✓ Summary fetched:', response.data.totalActivities, 'activities');
      } else {
        logger.error('[engagementApi] ✗ Failed to fetch summary:', response.error);
      }

      return response;
    } catch (error) {
      logger.error('[engagementApi] Exception fetching summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch summary',
      };
    }
  },

  // ============================================
  // ACHIEVEMENTS API
  // ============================================

  /**
   * Get all achievements with progress
   */
  async getAchievements(): Promise<ApiResponse<AchievementsResponse>> {
    try {
      logger.debug('[engagementApi] Fetching achievements');
      const response = await apiClient.get<AchievementsResponse>('/achievements');

      if (isApiSuccess(response)) {
        logger.debug('[engagementApi] ✓ Achievements fetched:', response.data.totalUnlocked, 'unlocked');
      } else {
        logger.error('[engagementApi] ✗ Failed to fetch achievements:', response.error);
      }

      return response;
    } catch (error) {
      logger.error('[engagementApi] Exception fetching achievements:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch achievements',
      };
    }
  },

  /**
   * Check and unlock eligible achievements
   */
  async checkAchievements(): Promise<ApiResponse<CheckAchievementsResponse>> {
    try {
      logger.debug('[engagementApi] Checking achievements');
      const response = await apiClient.post<CheckAchievementsResponse>('/achievements/check', {});

      if (isApiSuccess(response)) {
        logger.debug('[engagementApi] ✓ Achievements checked:', response.data.count, 'newly unlocked');
      } else {
        logger.error('[engagementApi] ✗ Failed to check achievements:', response.error);
      }

      return response;
    } catch (error) {
      logger.error('[engagementApi] Exception checking achievements:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check achievements',
      };
    }
  },

  /**
   * Get milestone progress
   */
  async getMilestones(): Promise<ApiResponse<MilestoneResponse>> {
    try {
      logger.debug('[engagementApi] Fetching milestones');
      const response = await apiClient.get<MilestoneResponse>('/achievements/milestones');

      if (isApiSuccess(response)) {
        logger.debug('[engagementApi] ✓ Milestones fetched, next:', response.data.nextMilestone?.id || 'none');
      } else {
        logger.error('[engagementApi] ✗ Failed to fetch milestones:', response.error);
      }

      return response;
    } catch (error) {
      logger.error('[engagementApi] Exception fetching milestones:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch milestones',
      };
    }
  },

  /**
   * Get user stats
   */
  async getStats(): Promise<ApiResponse<UserStats>> {
    try {
      logger.debug('[engagementApi] Fetching user stats');
      const response = await apiClient.get<UserStats>('/achievements/stats');

      if (isApiSuccess(response)) {
        logger.debug('[engagementApi] ✓ Stats fetched');
      } else {
        logger.error('[engagementApi] ✗ Failed to fetch stats:', response.error);
      }

      return response;
    } catch (error) {
      logger.error('[engagementApi] Exception fetching stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      };
    }
  },
};
