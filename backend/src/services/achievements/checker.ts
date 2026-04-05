/**
 * Achievement Checker Service
 * Handles checking and unlocking achievements
 */

import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import {
  UserAchievement,
  AchievementProgress,
  UserStats,
  NewlyUnlockedAchievement,
  MilestoneResponse,
  Milestone,
} from './types';
import {
  ACHIEVEMENTS,
  MILESTONES,
  calculateAchievementProgress,
  shouldUnlockAchievement,
  getMilestoneProgress,
} from './definitions';

const ACHIEVEMENTS_TABLE = process.env.USER_ACHIEVEMENTS_TABLE_NAME || 'user-achievements';
const ACTIVITY_TABLE = process.env.USER_ACTIVITY_TABLE_NAME || 'user-activity';
const STREAKS_TABLE = process.env.USER_STREAKS_TABLE_NAME || 'user-streaks';
const MESSAGES_TABLE = process.env.MESSAGES_TABLE_NAME || 'messages';
const CALLS_TABLE = process.env.CALLS_TABLE_NAME || 'calls';
const QUEST_SESSIONS_TABLE = process.env.QUEST_SESSIONS_TABLE_NAME || 'quest-sessions';

/**
 * Get user statistics for achievement checking
 */
export async function getUserStats(
  db: DynamoDBDocumentClient,
  userId: string
): Promise<UserStats> {
  // Get message count
  let totalMessages = 0;
  try {
    const messagesResult = await db.send(new QueryCommand({
      TableName: MESSAGES_TABLE,
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      Select: 'COUNT',
    }));
    totalMessages = messagesResult.Count || 0;
  } catch (error) {
    console.log('[ACHIEVEMENTS] Could not get message count:', error);
  }

  // Get call count and duration
  let totalCalls = 0;
  let totalCallMinutes = 0;
  try {
    const callsResult = await db.send(new QueryCommand({
      TableName: CALLS_TABLE,
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    }));
    const calls = callsResult.Items || [];
    totalCalls = calls.length;
    totalCallMinutes = calls.reduce((acc, call) => {
      const duration = call.duration_seconds || call.durationSeconds || 0;
      return acc + Math.floor(duration / 60);
    }, 0);
  } catch (error) {
    console.log('[ACHIEVEMENTS] Could not get call count:', error);
  }

  // Get streak data
  let currentStreak = 0;
  let bestStreak = 0;
  try {
    const streakResult = await db.send(new GetCommand({
      TableName: STREAKS_TABLE,
      Key: { user_id: userId, streak_type: 'daily' },
    }));
    if (streakResult.Item) {
      currentStreak = streakResult.Item.current_streak || 0;
      bestStreak = streakResult.Item.best_streak || 0;
    }
  } catch (error) {
    console.log('[ACHIEVEMENTS] Could not get streak data:', error);
  }

  // Get quest data
  let questsCompleted = 0;
  let questsStarted = 0;
  try {
    const questResult = await db.send(new QueryCommand({
      TableName: QUEST_SESSIONS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': `USER#${userId}` },
    }));
    const sessions = questResult.Items || [];
    questsStarted = sessions.filter(s => s.sk?.includes('SESSION#')).length;
    questsCompleted = sessions.filter(s =>
      s.sk?.includes('SESSION#') && s.status === 'completed'
    ).length;
  } catch (error) {
    console.log('[ACHIEVEMENTS] Could not get quest data:', error);
  }

  // Get activity data for engagement stats
  let totalActiveDays = 0;
  let agentsEngaged = 0;
  try {
    const activityResult = await db.send(new QueryCommand({
      TableName: ACTIVITY_TABLE,
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    }));
    const activities = activityResult.Items || [];

    // Count unique days
    const uniqueDays = new Set(activities.map(a => a.timestamp?.split('T')[0]).filter(Boolean));
    totalActiveDays = uniqueDays.size;

    // Count unique agents
    const uniqueAgents = new Set(activities.map(a => a.agent_id).filter(Boolean));
    agentsEngaged = uniqueAgents.size;
  } catch (error) {
    console.log('[ACHIEVEMENTS] Could not get activity data:', error);
  }

  return {
    totalMessages,
    totalCalls,
    totalCallMinutes,
    currentStreak,
    bestStreak,
    questsCompleted,
    questsStarted,
    totalActiveDays,
    agentsEngaged,
  };
}

/**
 * Get all user achievements from database
 */
export async function getUserAchievements(
  db: DynamoDBDocumentClient,
  userId: string
): Promise<UserAchievement[]> {
  const result = await db.send(new QueryCommand({
    TableName: ACHIEVEMENTS_TABLE,
    KeyConditionExpression: 'user_id = :userId',
    ExpressionAttributeValues: { ':userId': userId },
  }));

  return (result.Items || []) as UserAchievement[];
}

/**
 * Save an unlocked achievement
 */
export async function saveAchievement(
  db: DynamoDBDocumentClient,
  userId: string,
  achievementId: string,
  progress: number
): Promise<UserAchievement> {
  const achievement: UserAchievement = {
    user_id: userId,
    achievement_id: achievementId,
    unlock_date: new Date().toISOString(),
    progress,
    is_unlocked: progress >= 100,
    notified: false,
  };

  await db.send(new PutCommand({
    TableName: ACHIEVEMENTS_TABLE,
    Item: achievement,
  }));

  return achievement;
}

/**
 * Check and unlock all eligible achievements
 * Returns list of newly unlocked achievements
 */
export async function checkAndUnlockAchievements(
  db: DynamoDBDocumentClient,
  userId: string
): Promise<NewlyUnlockedAchievement[]> {
  console.log(`[ACHIEVEMENTS] Checking achievements for user ${userId}`);

  // Get current user stats
  const stats = await getUserStats(db, userId);
  console.log(`[ACHIEVEMENTS] User stats:`, stats);

  // Get existing achievements
  const existingAchievements = await getUserAchievements(db, userId);
  const unlockedIds = new Set(
    existingAchievements
      .filter(a => a.is_unlocked)
      .map(a => a.achievement_id)
  );

  const newlyUnlocked: NewlyUnlockedAchievement[] = [];

  // Check each achievement
  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    if (unlockedIds.has(achievement.id)) {
      continue;
    }

    // Calculate progress
    const progress = calculateAchievementProgress(achievement, stats);

    // Check if should unlock
    if (shouldUnlockAchievement(achievement, stats)) {
      console.log(`[ACHIEVEMENTS] ✓ Unlocking achievement: ${achievement.id}`);

      await saveAchievement(db, userId, achievement.id, 100);

      newlyUnlocked.push({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
      });
    } else if (progress > 0) {
      // Update progress for in-progress achievements
      const existing = existingAchievements.find(a => a.achievement_id === achievement.id);
      if (!existing || existing.progress !== progress) {
        await saveAchievement(db, userId, achievement.id, progress);
      }
    }
  }

  if (newlyUnlocked.length > 0) {
    console.log(`[ACHIEVEMENTS] ✓ Unlocked ${newlyUnlocked.length} new achievements`);
  }

  return newlyUnlocked;
}

/**
 * Get all achievements with progress for a user
 */
export async function getAchievementsWithProgress(
  db: DynamoDBDocumentClient,
  userId: string
): Promise<{
  unlocked: AchievementProgress[];
  inProgress: AchievementProgress[];
  locked: AchievementProgress[];
}> {
  const stats = await getUserStats(db, userId);
  const existingAchievements = await getUserAchievements(db, userId);

  const achievementMap = new Map(
    existingAchievements.map(a => [a.achievement_id, a])
  );

  const unlocked: AchievementProgress[] = [];
  const inProgress: AchievementProgress[] = [];
  const locked: AchievementProgress[] = [];

  for (const definition of ACHIEVEMENTS) {
    const existing = achievementMap.get(definition.id);
    const progress = calculateAchievementProgress(definition, stats);
    const isUnlocked = existing?.is_unlocked || progress >= 100;

    const achievementProgress: AchievementProgress = {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      category: definition.category,
      progress,
      isUnlocked,
      unlockDate: existing?.unlock_date,
      hidden: definition.hidden,
    };

    if (isUnlocked) {
      unlocked.push(achievementProgress);
    } else if (progress > 0) {
      inProgress.push(achievementProgress);
    } else {
      // Don't show hidden achievements that aren't unlocked
      if (!definition.hidden) {
        locked.push(achievementProgress);
      }
    }
  }

  // Sort unlocked by unlock date (most recent first)
  unlocked.sort((a, b) => {
    if (!a.unlockDate) return 1;
    if (!b.unlockDate) return -1;
    return b.unlockDate.localeCompare(a.unlockDate);
  });

  // Sort in-progress by progress (highest first)
  inProgress.sort((a, b) => b.progress - a.progress);

  return { unlocked, inProgress, locked };
}

/**
 * Get milestone progress for a user
 */
export async function getMilestonesProgress(
  db: DynamoDBDocumentClient,
  userId: string
): Promise<MilestoneResponse> {
  const stats = await getUserStats(db, userId);

  const milestones: Milestone[] = MILESTONES.map(m => {
    const { current, progress, completed } = getMilestoneProgress(m, stats);
    return {
      id: m.id,
      type: m.type,
      target: m.target,
      current,
      progress,
      reward: m.reward,
      icon: m.icon,
      completed,
    };
  });

  // Separate completed and incomplete
  const completedMilestones = milestones.filter(m => m.completed);
  const incompleteMilestones = milestones.filter(m => !m.completed);

  // Sort incomplete by progress (highest first)
  incompleteMilestones.sort((a, b) => b.progress - a.progress);

  // Get next milestone (closest to completion)
  const nextMilestone = incompleteMilestones[0];

  // Get upcoming milestones (next 3 after the first)
  const upcomingMilestones = incompleteMilestones.slice(1, 4);

  return {
    nextMilestone,
    upcomingMilestones,
    completedMilestones,
  };
}
