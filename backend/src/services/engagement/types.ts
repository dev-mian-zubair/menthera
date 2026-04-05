/**
 * Engagement Service Types
 * Types for activity tracking, streaks, and achievements
 */

export type ActivityType = 'message' | 'call' | 'quest_start' | 'quest_complete' | 'login';

export interface Activity {
  user_id: string;
  timestamp: string; // ISO format
  activity_type: ActivityType;
  agent_id?: string;
  duration_seconds?: number; // For calls
  metadata?: Record<string, any>;
  ttl?: number; // Unix timestamp for auto-expiration (90 days)
}

export interface ActivitySummary {
  totalActivities: number;
  activeDaysLast7: number;
  activeDaysLast30: number;
  byType: Record<ActivityType, number>;
  byAgent: Record<string, number>;
}

export interface RecentActivity {
  agentId: string;
  agentName?: string;
  lastInteractionDate: string;
  activityType: ActivityType;
  interactionCount7Days: number;
}

export interface StreakData {
  user_id: string;
  streak_type: string; // 'daily' or 'agent#<agentId>'
  current_streak: number;
  best_streak: number;
  last_activity_date: string; // YYYY-MM-DD format
  streak_start_date: string;
  activity_count_this_period: number;
  total_lifetime_activities: number;
  last_updated: string;
}

export interface StreakResponse {
  daily: {
    current: number;
    best: number;
    lastActivityDate: string;
    startDate: string;
  };
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

export interface RecentActivityResponse {
  recentConversations: RecentActivity[];
  summary: {
    totalInteractions: number;
    activeDays: number;
  };
}
