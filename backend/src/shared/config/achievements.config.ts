/**
 * Achievement Thresholds Configuration
 *
 * Centralized configuration for all achievement milestones and thresholds.
 * Update these values to adjust achievement requirements across the app.
 */

/**
 * Message achievement thresholds
 */
export const MESSAGE_THRESHOLDS = {
  first: 1,
  tier1: 10,
  tier2: 50,
  tier3: 100,
  tier4: 500,
} as const;

/**
 * Call achievement thresholds
 */
export const CALL_THRESHOLDS = {
  first: 1,
  tier1: 5,
  tier2: 10,
} as const;

/**
 * Call duration thresholds (in minutes)
 */
export const CALL_MINUTES_THRESHOLDS = {
  tier1: 30,
  tier2: 60,
} as const;

/**
 * Streak achievement thresholds (consecutive days)
 */
export const STREAK_THRESHOLDS = {
  tier1: 3,
  tier2: 7,
  tier3: 14,
  tier4: 30,
} as const;

/**
 * Quest achievement thresholds
 */
export const QUEST_THRESHOLDS = {
  started: 1,
  completed1: 1,
  completed3: 3,
} as const;

/**
 * Engagement achievement thresholds
 */
export const ENGAGEMENT_THRESHOLDS = {
  /** Number of different agents engaged */
  multiAgent: 3,
  /** Active days in a week */
  activeDays: 5,
} as const;

/**
 * Milestone definitions for gamification UI
 */
export const MILESTONE_THRESHOLDS = {
  messages: [10, 25, 50, 100],
  streaks: [7, 14, 30],
  quests: [1, 3],
  calls: [5, 10],
} as const;

/**
 * Display configuration
 */
export const ACHIEVEMENT_DISPLAY_CONFIG = {
  /** Number of upcoming milestones to show in progress UI */
  upcomingMilestonesCount: 3,
} as const;

/**
 * All thresholds combined for easy access
 */
export const ACHIEVEMENT_THRESHOLDS = {
  messages: MESSAGE_THRESHOLDS,
  calls: CALL_THRESHOLDS,
  callMinutes: CALL_MINUTES_THRESHOLDS,
  streaks: STREAK_THRESHOLDS,
  quests: QUEST_THRESHOLDS,
  engagement: ENGAGEMENT_THRESHOLDS,
  milestones: MILESTONE_THRESHOLDS,
  display: ACHIEVEMENT_DISPLAY_CONFIG,
} as const;

/**
 * Get threshold value for a specific achievement type and tier
 */
export function getThreshold(
  category: 'messages' | 'calls' | 'callMinutes' | 'streaks' | 'quests',
  tier: string
): number {
  const categoryThresholds = ACHIEVEMENT_THRESHOLDS[category];
  return (categoryThresholds as Record<string, number>)[tier] || 0;
}

/**
 * Check if a value meets a specific threshold
 */
export function meetsThreshold(
  value: number,
  category: 'messages' | 'calls' | 'callMinutes' | 'streaks' | 'quests',
  tier: string
): boolean {
  const threshold = getThreshold(category, tier);
  return value >= threshold;
}
