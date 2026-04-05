/**
 * Achievement Definitions
 * Static configuration of all available achievements
 */

import { AchievementDefinition, Milestone, UserStats } from './types';
import {
  MESSAGE_THRESHOLDS,
  CALL_THRESHOLDS,
  CALL_MINUTES_THRESHOLDS,
  STREAK_THRESHOLDS,
  QUEST_THRESHOLDS,
  ENGAGEMENT_THRESHOLDS,
  MILESTONE_THRESHOLDS,
} from '../../shared/config/achievements.config';

/**
 * All achievement definitions
 * Each achievement has a condition function that takes user stats and returns true if unlocked
 */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Messaging achievements
  {
    id: 'first_message',
    title: 'First Steps',
    description: 'Sent your first message',
    icon: '💬',
    category: 'messaging',
    targetValue: MESSAGE_THRESHOLDS.first,
  },
  {
    id: 'message_10',
    title: 'Getting Started',
    description: `Sent ${MESSAGE_THRESHOLDS.tier1} messages`,
    icon: '📝',
    category: 'messaging',
    targetValue: MESSAGE_THRESHOLDS.tier1,
  },
  {
    id: 'message_50',
    title: 'Conversation Pro',
    description: `Sent ${MESSAGE_THRESHOLDS.tier2} messages`,
    icon: '✉️',
    category: 'messaging',
    targetValue: MESSAGE_THRESHOLDS.tier2,
  },
  {
    id: 'message_100',
    title: 'Chatterbox',
    description: `Sent ${MESSAGE_THRESHOLDS.tier3} messages`,
    icon: '🗣️',
    category: 'messaging',
    targetValue: MESSAGE_THRESHOLDS.tier3,
  },
  {
    id: 'message_500',
    title: 'Message Master',
    description: `Sent ${MESSAGE_THRESHOLDS.tier4} messages`,
    icon: '💎',
    category: 'messaging',
    targetValue: MESSAGE_THRESHOLDS.tier4,
  },

  // Call achievements
  {
    id: 'first_call',
    title: 'First Connection',
    description: 'Completed your first voice call',
    icon: '📞',
    category: 'calls',
    targetValue: CALL_THRESHOLDS.first,
  },
  {
    id: 'call_5',
    title: 'Voice Explorer',
    description: `Completed ${CALL_THRESHOLDS.tier1} voice calls`,
    icon: '🎙️',
    category: 'calls',
    targetValue: CALL_THRESHOLDS.tier1,
  },
  {
    id: 'call_10',
    title: 'Voice Master',
    description: `Completed ${CALL_THRESHOLDS.tier2} voice calls`,
    icon: '🎤',
    category: 'calls',
    targetValue: CALL_THRESHOLDS.tier2,
  },
  {
    id: 'call_30_min',
    title: 'Deep Talker',
    description: `Spent ${CALL_MINUTES_THRESHOLDS.tier1} minutes in voice calls`,
    icon: '⏱️',
    category: 'calls',
    targetValue: CALL_MINUTES_THRESHOLDS.tier1,
  },
  {
    id: 'call_60_min',
    title: 'Conversation Champion',
    description: 'Spent 1 hour in voice calls',
    icon: '🏆',
    category: 'calls',
    targetValue: CALL_MINUTES_THRESHOLDS.tier2,
  },

  // Streak achievements
  {
    id: 'streak_3',
    title: `${STREAK_THRESHOLDS.tier1} Day Streak`,
    description: `Stayed engaged for ${STREAK_THRESHOLDS.tier1} consecutive days`,
    icon: '🔥',
    category: 'streaks',
    targetValue: STREAK_THRESHOLDS.tier1,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: `Stayed engaged for ${STREAK_THRESHOLDS.tier2} consecutive days`,
    icon: '🔥',
    category: 'streaks',
    targetValue: STREAK_THRESHOLDS.tier2,
  },
  {
    id: 'streak_14',
    title: 'Two Week Champion',
    description: `Stayed engaged for ${STREAK_THRESHOLDS.tier3} consecutive days`,
    icon: '⭐',
    category: 'streaks',
    targetValue: STREAK_THRESHOLDS.tier3,
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: `Stayed engaged for ${STREAK_THRESHOLDS.tier4} consecutive days`,
    icon: '👑',
    category: 'streaks',
    targetValue: STREAK_THRESHOLDS.tier4,
  },

  // Quest achievements
  {
    id: 'quest_first',
    title: 'Quest Beginner',
    description: 'Started your first personalization quest',
    icon: '🎯',
    category: 'quests',
    targetValue: QUEST_THRESHOLDS.started,
  },
  {
    id: 'quest_complete_1',
    title: 'Quest Champion',
    description: 'Completed your first personalization quest',
    icon: '🏅',
    category: 'quests',
    targetValue: QUEST_THRESHOLDS.completed1,
  },
  {
    id: 'quest_complete_3',
    title: 'Quest Master',
    description: `Completed ${QUEST_THRESHOLDS.completed3} personalization quests`,
    icon: '🌟',
    category: 'quests',
    targetValue: QUEST_THRESHOLDS.completed3,
  },

  // Engagement achievements
  {
    id: 'multi_agent',
    title: 'Explorer',
    description: `Engaged with ${ENGAGEMENT_THRESHOLDS.multiAgent} different coaches`,
    icon: '🧭',
    category: 'engagement',
    targetValue: ENGAGEMENT_THRESHOLDS.multiAgent,
  },
  {
    id: 'active_week',
    title: 'Dedicated User',
    description: `Active for ${ENGAGEMENT_THRESHOLDS.activeDays} days in a week`,
    icon: '📅',
    category: 'engagement',
    targetValue: ENGAGEMENT_THRESHOLDS.activeDays,
  },
  {
    id: 'early_bird',
    title: 'Early Adopter',
    description: 'One of our first users!',
    icon: '🐣',
    category: 'engagement',
    targetValue: 1,
    hidden: true, // Special achievement
  },
];

/**
 * Get achievement definition by ID
 */
export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

/**
 * Get all achievements in a category
 */
export function getAchievementsByCategory(category: string): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

/**
 * Calculate progress for an achievement based on user stats
 */
export function calculateAchievementProgress(
  achievement: AchievementDefinition,
  stats: UserStats
): number {
  let currentValue = 0;

  switch (achievement.id) {
    // Messaging
    case 'first_message':
    case 'message_10':
    case 'message_50':
    case 'message_100':
    case 'message_500':
      currentValue = stats.totalMessages;
      break;

    // Calls
    case 'first_call':
    case 'call_5':
    case 'call_10':
      currentValue = stats.totalCalls;
      break;
    case 'call_30_min':
    case 'call_60_min':
      currentValue = stats.totalCallMinutes;
      break;

    // Streaks
    case 'streak_3':
    case 'streak_7':
    case 'streak_14':
    case 'streak_30':
      currentValue = stats.currentStreak;
      break;

    // Quests
    case 'quest_first':
      currentValue = stats.questsStarted;
      break;
    case 'quest_complete_1':
    case 'quest_complete_3':
      currentValue = stats.questsCompleted;
      break;

    // Engagement
    case 'multi_agent':
      currentValue = stats.agentsEngaged;
      break;
    case 'active_week':
      currentValue = stats.totalActiveDays; // Simplified for now
      break;

    default:
      currentValue = 0;
  }

  const progress = Math.min(100, Math.round((currentValue / achievement.targetValue) * 100));
  return progress;
}

/**
 * Check if an achievement should be unlocked
 */
export function shouldUnlockAchievement(
  achievement: AchievementDefinition,
  stats: UserStats
): boolean {
  const progress = calculateAchievementProgress(achievement, stats);
  return progress >= 100;
}

/**
 * Milestone definitions for gamification
 */
export const MILESTONES: Array<{
  id: string;
  type: 'message_count' | 'call_count' | 'streak' | 'quest' | 'engagement';
  target: number;
  reward: string;
  icon: string;
}> = [
  // Message milestones (from config)
  { id: 'msg_10', type: 'message_count', target: MILESTONE_THRESHOLDS.messages[0], reward: `${MILESTONE_THRESHOLDS.messages[0]} Messages Badge`, icon: '📝' },
  { id: 'msg_25', type: 'message_count', target: MILESTONE_THRESHOLDS.messages[1], reward: `${MILESTONE_THRESHOLDS.messages[1]} Messages Badge`, icon: '💬' },
  { id: 'msg_50', type: 'message_count', target: MILESTONE_THRESHOLDS.messages[2], reward: 'Pro Chatter Badge', icon: '✨' },
  { id: 'msg_100', type: 'message_count', target: MILESTONE_THRESHOLDS.messages[3], reward: 'Centurion Badge', icon: '💯' },

  // Streak milestones (from config)
  { id: 'streak_7', type: 'streak', target: MILESTONE_THRESHOLDS.streaks[0], reward: 'Week Warrior Badge', icon: '🔥' },
  { id: 'streak_14', type: 'streak', target: MILESTONE_THRESHOLDS.streaks[1], reward: 'Two Week Titan Badge', icon: '⭐' },
  { id: 'streak_30', type: 'streak', target: MILESTONE_THRESHOLDS.streaks[2], reward: 'Monthly Master Badge', icon: '👑' },

  // Quest milestones (from config)
  { id: 'quest_1', type: 'quest', target: MILESTONE_THRESHOLDS.quests[0], reward: 'First Quest Badge', icon: '🎯' },
  { id: 'quest_3', type: 'quest', target: MILESTONE_THRESHOLDS.quests[1], reward: 'Quest Explorer Badge', icon: '🗺️' },

  // Call milestones (from config)
  { id: 'call_5', type: 'call_count', target: MILESTONE_THRESHOLDS.calls[0], reward: 'Voice Explorer Badge', icon: '📞' },
  { id: 'call_10', type: 'call_count', target: MILESTONE_THRESHOLDS.calls[1], reward: 'Voice Master Badge', icon: '🎤' },
];

/**
 * Get milestone progress based on user stats
 */
export function getMilestoneProgress(
  milestone: typeof MILESTONES[0],
  stats: UserStats
): { current: number; progress: number; completed: boolean } {
  let current = 0;

  switch (milestone.type) {
    case 'message_count':
      current = stats.totalMessages;
      break;
    case 'call_count':
      current = stats.totalCalls;
      break;
    case 'streak':
      current = stats.currentStreak;
      break;
    case 'quest':
      current = stats.questsCompleted;
      break;
    case 'engagement':
      current = stats.totalActiveDays;
      break;
  }

  const progress = Math.min(100, Math.round((current / milestone.target) * 100));
  const completed = progress >= 100;

  return { current, progress, completed };
}
