/**
 * Engagement Service Helpers
 * Utility functions for activity tracking and streak calculations
 */

import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { Activity, ActivityType, RecentActivity, StreakData, ActivitySummary } from './types';

const ACTIVITY_TABLE = process.env.USER_ACTIVITY_TABLE_NAME || 'user-activity';
const STREAKS_TABLE = process.env.USER_STREAKS_TABLE_NAME || 'user-streaks';

// TTL: 90 days in seconds
const ACTIVITY_TTL_DAYS = 90;

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Calculate TTL timestamp (90 days from now)
 */
export function calculateTTL(): number {
  return Math.floor(Date.now() / 1000) + (ACTIVITY_TTL_DAYS * 24 * 60 * 60);
}

/**
 * Record a user activity
 */
export async function recordActivity(
  db: DynamoDBDocumentClient,
  userId: string,
  activityType: ActivityType,
  agentId?: string,
  durationSeconds?: number,
  metadata?: Record<string, any>
): Promise<Activity> {
  const timestamp = new Date().toISOString();
  const activityId = randomUUID();

  const activity: Activity = {
    user_id: userId,
    timestamp,
    activity_type: activityType,
    agent_id: agentId,
    duration_seconds: durationSeconds,
    metadata: {
      ...metadata,
      activity_id: activityId,
    },
    ttl: calculateTTL(),
  };

  await db.send(new PutCommand({
    TableName: ACTIVITY_TABLE,
    Item: activity,
  }));

  console.log(`[ENGAGEMENT] Activity recorded: ${activityType} for user ${userId}`);
  return activity;
}

/**
 * Get recent activities for a user (last 7 days by default)
 */
export async function getRecentActivities(
  db: DynamoDBDocumentClient,
  userId: string,
  days: number = 7
): Promise<Activity[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startTimestamp = startDate.toISOString();

  const result = await db.send(new QueryCommand({
    TableName: ACTIVITY_TABLE,
    KeyConditionExpression: 'user_id = :userId AND #ts >= :startTs',
    ExpressionAttributeNames: {
      '#ts': 'timestamp',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':startTs': startTimestamp,
    },
    ScanIndexForward: false, // Most recent first
  }));

  return (result.Items || []) as Activity[];
}

/**
 * Get recent conversations grouped by agent
 */
export async function getRecentConversations(
  db: DynamoDBDocumentClient,
  userId: string,
  limit: number = 5
): Promise<RecentActivity[]> {
  const activities = await getRecentActivities(db, userId, 7);

  // Group by agent and get most recent
  const agentMap = new Map<string, {
    lastInteractionDate: string;
    activityType: ActivityType;
    count: number;
  }>();

  for (const activity of activities) {
    if (!activity.agent_id) continue;

    const existing = agentMap.get(activity.agent_id);
    if (!existing || activity.timestamp > existing.lastInteractionDate) {
      agentMap.set(activity.agent_id, {
        lastInteractionDate: activity.timestamp,
        activityType: activity.activity_type,
        count: (existing?.count || 0) + 1,
      });
    } else {
      agentMap.set(activity.agent_id, {
        ...existing,
        count: existing.count + 1,
      });
    }
  }

  // Convert to array and sort by recency
  const recentConversations: RecentActivity[] = Array.from(agentMap.entries())
    .map(([agentId, data]) => ({
      agentId,
      lastInteractionDate: data.lastInteractionDate,
      activityType: data.activityType,
      interactionCount7Days: data.count,
    }))
    .sort((a, b) => b.lastInteractionDate.localeCompare(a.lastInteractionDate))
    .slice(0, limit);

  return recentConversations;
}

/**
 * Get activity summary for a user
 */
export async function getActivitySummary(
  db: DynamoDBDocumentClient,
  userId: string
): Promise<ActivitySummary> {
  const activities7Days = await getRecentActivities(db, userId, 7);
  const activities30Days = await getRecentActivities(db, userId, 30);

  // Calculate unique active days
  const uniqueDays7 = new Set(activities7Days.map(a => a.timestamp.split('T')[0]));
  const uniqueDays30 = new Set(activities30Days.map(a => a.timestamp.split('T')[0]));

  // Count by type
  const byType: Record<string, number> = {};
  const byAgent: Record<string, number> = {};

  for (const activity of activities30Days) {
    byType[activity.activity_type] = (byType[activity.activity_type] || 0) + 1;
    if (activity.agent_id) {
      byAgent[activity.agent_id] = (byAgent[activity.agent_id] || 0) + 1;
    }
  }

  return {
    totalActivities: activities30Days.length,
    activeDaysLast7: uniqueDays7.size,
    activeDaysLast30: uniqueDays30.size,
    byType: byType as Record<ActivityType, number>,
    byAgent,
  };
}

/**
 * Update user streak after activity
 */
export async function updateStreak(
  db: DynamoDBDocumentClient,
  userId: string,
  streakType: string = 'daily'
): Promise<StreakData> {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  // Get current streak data
  const result = await db.send(new GetCommand({
    TableName: STREAKS_TABLE,
    Key: {
      user_id: userId,
      streak_type: streakType,
    },
  }));

  const existingStreak = result.Item as StreakData | undefined;

  let newStreak: StreakData;

  if (!existingStreak) {
    // First activity - start new streak
    newStreak = {
      user_id: userId,
      streak_type: streakType,
      current_streak: 1,
      best_streak: 1,
      last_activity_date: today,
      streak_start_date: today,
      activity_count_this_period: 1,
      total_lifetime_activities: 1,
      last_updated: new Date().toISOString(),
    };
  } else if (existingStreak.last_activity_date === today) {
    // Already active today - just increment count
    newStreak = {
      ...existingStreak,
      activity_count_this_period: existingStreak.activity_count_this_period + 1,
      total_lifetime_activities: existingStreak.total_lifetime_activities + 1,
      last_updated: new Date().toISOString(),
    };
  } else if (existingStreak.last_activity_date === yesterday) {
    // Consecutive day - extend streak
    const newCurrentStreak = existingStreak.current_streak + 1;
    newStreak = {
      ...existingStreak,
      current_streak: newCurrentStreak,
      best_streak: Math.max(existingStreak.best_streak, newCurrentStreak),
      last_activity_date: today,
      activity_count_this_period: 1,
      total_lifetime_activities: existingStreak.total_lifetime_activities + 1,
      last_updated: new Date().toISOString(),
    };
  } else {
    // Gap > 1 day - reset streak
    newStreak = {
      ...existingStreak,
      current_streak: 1,
      last_activity_date: today,
      streak_start_date: today,
      activity_count_this_period: 1,
      total_lifetime_activities: existingStreak.total_lifetime_activities + 1,
      last_updated: new Date().toISOString(),
    };
  }

  // Save streak
  await db.send(new PutCommand({
    TableName: STREAKS_TABLE,
    Item: newStreak,
  }));

  console.log(`[ENGAGEMENT] Streak updated for user ${userId}: ${newStreak.current_streak} days`);
  return newStreak;
}

/**
 * Get all streaks for a user
 */
export async function getUserStreaks(
  db: DynamoDBDocumentClient,
  userId: string
): Promise<StreakData[]> {
  const result = await db.send(new QueryCommand({
    TableName: STREAKS_TABLE,
    KeyConditionExpression: 'user_id = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  }));

  return (result.Items || []) as StreakData[];
}

/**
 * Get daily streak for a user
 */
export async function getDailyStreak(
  db: DynamoDBDocumentClient,
  userId: string
): Promise<StreakData | null> {
  const result = await db.send(new GetCommand({
    TableName: STREAKS_TABLE,
    Key: {
      user_id: userId,
      streak_type: 'daily',
    },
  }));

  return (result.Item as StreakData) || null;
}
