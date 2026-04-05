/**
 * Engagement Service API
 * Handles activity tracking, streaks, and recent activity retrieval
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { handle } from 'hono/aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getAuth } from '@hono/clerk-auth';
import customClerkMiddleware from '../../shared/auth-middleware';
import {
  buildHonoSuccess,
  buildHonoUnauthorized,
  buildHonoErrorResponse,
  buildHonoBadRequest,
} from '../../shared/utils/response-builder';
import {
  recordActivity,
  updateStreak,
  getRecentConversations,
  getActivitySummary,
  getUserStreaks,
  getDailyStreak,
} from './helpers';
import { TrackActivityRequest, ActivityType, StreakResponse, RecentActivityResponse } from './types';

const app = new Hono();

app.use(logger());
app.use('*', customClerkMiddleware);
app.use('*', cors());

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const AGENTS_TABLE = process.env.AGENTS_TABLE_NAME || 'agents';

/**
 * POST /engagement/activity - Track a user activity
 * Body: { activityType, agentId?, durationSeconds?, metadata? }
 */
app.post('/engagement/activity', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;
    let body: TrackActivityRequest;

    try {
      body = await c.req.json();
    } catch (e) {
      return buildHonoBadRequest(c, 'Invalid request body');
    }

    const { activityType, agentId, durationSeconds, metadata } = body;

    // Validate activity type
    const validTypes: ActivityType[] = ['message', 'call', 'quest_start', 'quest_complete', 'login'];
    if (!validTypes.includes(activityType)) {
      return buildHonoBadRequest(c, `Invalid activity type. Must be one of: ${validTypes.join(', ')}`);
    }

    console.log(`[ENGAGEMENT] POST /engagement/activity - userId: ${userId}, type: ${activityType}`);

    // Record the activity
    const activity = await recordActivity(db, userId, activityType, agentId, durationSeconds, metadata);

    // Update daily streak
    const dailyStreak = await updateStreak(db, userId, 'daily');

    // Update agent-specific streak if agent provided
    let agentStreak;
    if (agentId) {
      agentStreak = await updateStreak(db, userId, `agent#${agentId}`);
    }

    const response = {
      activityId: activity.metadata?.activity_id,
      userId,
      timestamp: activity.timestamp,
      streakUpdated: {
        daily: dailyStreak.current_streak,
        agent: agentStreak?.current_streak,
      },
    };

    console.log(`[ENGAGEMENT] ✓ Activity tracked, daily streak: ${dailyStreak.current_streak}`);
    return buildHonoSuccess(c, response, 'Activity tracked successfully');
  } catch (error: any) {
    console.error('[ENGAGEMENT] ✗ Error tracking activity:', error);
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * GET /engagement/recent - Get recent activity for continue conversation feature
 * Query params: limit (default 5)
 */
app.get('/engagement/recent', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;
    const limit = parseInt(c.req.query('limit') || '5', 10);

    console.log(`[ENGAGEMENT] GET /engagement/recent - userId: ${userId}, limit: ${limit}`);

    // Get recent conversations grouped by agent
    const recentConversations = await getRecentConversations(db, userId, limit);

    // Enrich with agent names if we have agent data
    const enrichedConversations = await Promise.all(
      recentConversations.map(async (conv) => {
        try {
          // Try to get agent name from agents table
          const agentResult = await db.send(new QueryCommand({
            TableName: AGENTS_TABLE,
            KeyConditionExpression: 'agent_id = :agentId',
            ExpressionAttributeValues: {
              ':agentId': conv.agentId,
            },
            Limit: 1,
          }));

          const agent = agentResult.Items?.[0];
          return {
            ...conv,
            agentName: agent?.name || conv.agentId,
          };
        } catch {
          return conv;
        }
      })
    );

    // Get activity summary
    const summary = await getActivitySummary(db, userId);

    const response: RecentActivityResponse = {
      recentConversations: enrichedConversations,
      summary: {
        totalInteractions: summary.totalActivities,
        activeDays: summary.activeDaysLast7,
      },
    };

    console.log(`[ENGAGEMENT] ✓ Recent activity retrieved: ${enrichedConversations.length} conversations`);
    return buildHonoSuccess(c, response, 'Recent activity retrieved');
  } catch (error: any) {
    console.error('[ENGAGEMENT] ✗ Error getting recent activity:', error);
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * GET /engagement/streaks - Get user streak data
 */
app.get('/engagement/streaks', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;

    console.log(`[ENGAGEMENT] GET /engagement/streaks - userId: ${userId}`);

    // Get all streaks
    const streaks = await getUserStreaks(db, userId);

    // Separate daily and per-agent streaks
    const dailyStreak = streaks.find(s => s.streak_type === 'daily');
    const agentStreaks = streaks.filter(s => s.streak_type.startsWith('agent#'));

    const response: StreakResponse = {
      daily: dailyStreak
        ? {
            current: dailyStreak.current_streak,
            best: dailyStreak.best_streak,
            lastActivityDate: dailyStreak.last_activity_date,
            startDate: dailyStreak.streak_start_date,
          }
        : {
            current: 0,
            best: 0,
            lastActivityDate: '',
            startDate: '',
          },
      perAgent: agentStreaks.map(s => ({
        agentId: s.streak_type.replace('agent#', ''),
        current: s.current_streak,
        best: s.best_streak,
      })),
    };

    console.log(`[ENGAGEMENT] ✓ Streaks retrieved: daily=${response.daily.current}, agents=${response.perAgent.length}`);
    return buildHonoSuccess(c, response, 'Streak data retrieved');
  } catch (error: any) {
    console.error('[ENGAGEMENT] ✗ Error getting streaks:', error);
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * GET /engagement/summary - Get activity summary
 */
app.get('/engagement/summary', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;

    console.log(`[ENGAGEMENT] GET /engagement/summary - userId: ${userId}`);

    const summary = await getActivitySummary(db, userId);
    const dailyStreak = await getDailyStreak(db, userId);

    const response = {
      ...summary,
      currentStreak: dailyStreak?.current_streak || 0,
      bestStreak: dailyStreak?.best_streak || 0,
    };

    console.log(`[ENGAGEMENT] ✓ Summary retrieved: ${summary.totalActivities} activities`);
    return buildHonoSuccess(c, response, 'Activity summary retrieved');
  } catch (error: any) {
    console.error('[ENGAGEMENT] ✗ Error getting summary:', error);
    return buildHonoErrorResponse(c, error);
  }
});

export default handle(app);
