/**
 * Achievements Service Types
 * Types for achievements, milestones, and gamification
 */

export type AchievementCategory = 'messaging' | 'calls' | 'streaks' | 'quests' | 'engagement';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  targetValue: number;
  hidden?: boolean; // Hidden achievements show only when unlocked
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlock_date: string; // ISO timestamp
  progress: number; // 0-100
  is_unlocked: boolean;
  notified?: boolean; // Whether user has been shown the unlock notification
}

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
