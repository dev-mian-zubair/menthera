/**
 * Achievements Service API
 * Handles achievement and milestone endpoints
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { handle } from 'hono/aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getAuth } from '@hono/clerk-auth';
import customClerkMiddleware from '../../shared/auth-middleware';
import {
  buildHonoSuccess,
  buildHonoUnauthorized,
  buildHonoErrorResponse,
} from '../../shared/utils/response-builder';
import {
  checkAndUnlockAchievements,
  getAchievementsWithProgress,
  getMilestonesProgress,
  getUserStats,
} from './checker';
import { AchievementsResponse, MilestoneResponse } from './types';
import { ACHIEVEMENTS } from './definitions';

const app = new Hono();

app.use(logger());
app.use('*', customClerkMiddleware);
app.use('*', cors());

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

/**
 * GET /achievements - Get all achievements with progress
 * Returns unlocked, in-progress, and locked achievements
 */
app.get('/achievements', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;

    console.log(`[ACHIEVEMENTS] GET /achievements - userId: ${userId}`);

    const { unlocked, inProgress, locked } = await getAchievementsWithProgress(db, userId);

    const response: AchievementsResponse = {
      unlocked,
      inProgress,
      locked,
      totalUnlocked: unlocked.length,
      totalAchievements: ACHIEVEMENTS.filter(a => !a.hidden).length,
    };

    console.log(`[ACHIEVEMENTS] ✓ Retrieved ${unlocked.length} unlocked, ${inProgress.length} in progress`);
    return buildHonoSuccess(c, response, 'Achievements retrieved');
  } catch (error: any) {
    console.error('[ACHIEVEMENTS] ✗ Error getting achievements:', error);
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * POST /achievements/check - Check and unlock eligible achievements
 * Called after activities to unlock new achievements
 */
app.post('/achievements/check', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;

    console.log(`[ACHIEVEMENTS] POST /achievements/check - userId: ${userId}`);

    const newlyUnlocked = await checkAndUnlockAchievements(db, userId);

    const response = {
      newlyUnlocked,
      count: newlyUnlocked.length,
    };

    if (newlyUnlocked.length > 0) {
      console.log(`[ACHIEVEMENTS] ✓ Unlocked ${newlyUnlocked.length} new achievements`);
    }

    return buildHonoSuccess(c, response, 'Achievements checked');
  } catch (error: any) {
    console.error('[ACHIEVEMENTS] ✗ Error checking achievements:', error);
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * GET /achievements/milestones - Get milestone progress
 * Returns next milestone, upcoming milestones, and completed milestones
 */
app.get('/achievements/milestones', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;

    console.log(`[ACHIEVEMENTS] GET /achievements/milestones - userId: ${userId}`);

    const response: MilestoneResponse = await getMilestonesProgress(db, userId);

    console.log(`[ACHIEVEMENTS] ✓ Milestones retrieved: next=${response.nextMilestone?.id || 'none'}`);
    return buildHonoSuccess(c, response, 'Milestones retrieved');
  } catch (error: any) {
    console.error('[ACHIEVEMENTS] ✗ Error getting milestones:', error);
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * GET /achievements/stats - Get user stats for debugging/display
 */
app.get('/achievements/stats', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;

    console.log(`[ACHIEVEMENTS] GET /achievements/stats - userId: ${userId}`);

    const stats = await getUserStats(db, userId);

    console.log(`[ACHIEVEMENTS] ✓ Stats retrieved for user ${userId}`);
    return buildHonoSuccess(c, stats, 'Stats retrieved');
  } catch (error: any) {
    console.error('[ACHIEVEMENTS] ✗ Error getting stats:', error);
    return buildHonoErrorResponse(c, error);
  }
});

export default handle(app);
