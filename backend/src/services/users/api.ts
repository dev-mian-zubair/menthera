import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { handle } from 'hono/aws-lambda';
import { Webhook } from 'svix';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { getAuth } from '@hono/clerk-auth';
import customClerkMiddleware from '../../shared/auth-middleware';
import { SecretsHelper } from '../../shared/utils/secrets-helper';
import {
  buildHonoSuccess,
  buildHonoCreated,
  buildHonoUnauthorized,
  buildHonoConflict,
  buildHonoErrorResponse,
} from '../../shared/utils/response-builder';
import { SUBSCRIPTION_QUOTAS, getQuotaForPlan, DEFAULT_QUOTA } from '../../shared/config/quotas.config';
import { UserApiKeyService } from '../../shared/services/user-api-key.service';
import {
  getFirstDayOfNextMonth as getFirstDayOfNextMonthTz,
  shouldResetUsage as shouldResetUsageTz,
  isValidTimezone,
} from '../../shared/utils/timezone';

const app = new Hono();

app.use(logger());

// Apply Clerk middleware to all routes EXCEPT webhooks
// Webhooks are authenticated via signature verification, not Bearer tokens
app.use((c, next) => {
  if (c.req.path.startsWith('/webhooks')) {
    return next();
  }
  return customClerkMiddleware(c, next);
});

app.use('*', cors());

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);
const sqsClient = new SQSClient({});
const apiKeyService = new UserApiKeyService(db, process.env.USERS_TABLE_NAME || 'users');

/**
 * GET /users/usage - Retrieve user usage statistics
 * Returns: call minutes, message count, subscription info
 */
// Timezone-aware wrappers for usage reset logic.
// When a user's timezone is known, resets happen at midnight in their local time.
// Falls back to UTC if no timezone is stored (backwards compatible).
const getFirstDayOfNextMonth = (timezone?: string): string => {
  return getFirstDayOfNextMonthTz(timezone);
};

const shouldResetUsage = (resetDate: string, timezone?: string): boolean => {
  return shouldResetUsageTz(resetDate, timezone);
};

app.get('/users/usage', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;

    // Capture timezone from query param (sent by mobile app)
    const clientTimezone = c.req.query('timezone');
    console.log(`[USERS] GET /users/usage - userId: ${userId}, timezone: ${clientTimezone || 'not provided'}`);

    // Fetch user data from users table
    const userResult = await db.send(new GetCommand({
      TableName: process.env.USERS_TABLE_NAME || 'users',
      Key: {
        user_id: userId,
      },
    }));

    if (!userResult.Item) {
      console.log(`[USERS] New user detected, initializing with inactive tier`);
      const userTimezone = clientTimezone && isValidTimezone(clientTimezone) ? clientTimezone : undefined;
      const resetDate = getFirstDayOfNextMonth(userTimezone);
      const defaultUsage = {
        user_id: userId,
        plan: 'inactive',
        usedMinutes: 0,
        totalMinutes: DEFAULT_QUOTA.minutes,
        usedMessages: 0,
        totalMessages: DEFAULT_QUOTA.messages,
        resetDate,
        ...(userTimezone && { timezone: userTimezone }),
        createdAt: new Date().toISOString(),
      };

      await db.send(new PutCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Item: defaultUsage,
      }));

      const usageData = {
        userId,
        plan: 'inactive',
        isActive: false,
        minutes: {
          used: 0,
          total: DEFAULT_QUOTA.minutes,
          remaining: DEFAULT_QUOTA.minutes,
          percentageUsed: 0,
        },
        messages: {
          used: 0,
          total: DEFAULT_QUOTA.messages,
          remaining: DEFAULT_QUOTA.messages,
          percentageUsed: 0,
        },
        resetDate,
        createdAt: defaultUsage.createdAt,
        lastUpdated: new Date().toISOString(),
      };

      console.log(`[USERS] ✓ User initialized with inactive tier`);
      return buildHonoSuccess(c, usageData, 'User usage initialized');
    }

    // Calculate remaining usage
    const user = userResult.Item as any;
    let usedMinutes = user.usedMinutes || 0;
    let usedMessages = user.usedMessages || 0;
    const plan = user.plan || 'inactive';

    // Use stored timezone, or update from client if provided
    let userTimezone: string | undefined = user.timezone;
    let timezoneUpdated = false;

    if (clientTimezone && isValidTimezone(clientTimezone) && clientTimezone !== userTimezone) {
      userTimezone = clientTimezone;
      timezoneUpdated = true;
      console.log(`[USERS] Updating timezone for ${userId}: ${user.timezone || 'none'} → ${clientTimezone}`);
    }

    let resetDate = user.resetDate || getFirstDayOfNextMonth(userTimezone);

    let totalMinutes = user.totalMinutes;
    let totalMessages = user.totalMessages;

    // Check if we need to reset usage for the new month (timezone-aware)
    if (shouldResetUsage(resetDate, userTimezone)) {
      const planQuota = getQuotaForPlan(plan);
      totalMinutes = planQuota.minutes;
      totalMessages = planQuota.messages;

      console.log(`[USERS] Monthly reset required for user ${userId} (tz: ${userTimezone || 'UTC'})`);
      usedMinutes = 0;
      usedMessages = 0;
      resetDate = getFirstDayOfNextMonth(userTimezone);

      // Reset usage and persist timezone update in one operation
      await db.send(new UpdateCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: { user_id: userId },
        UpdateExpression: `SET usedMinutes = :zero, usedMessages = :zero, resetDate = :newResetDate, totalMinutes = :totalMin, totalMessages = :totalMsg${timezoneUpdated ? ', #tz = :tz' : ''}`,
        ...(timezoneUpdated && { ExpressionAttributeNames: { '#tz': 'timezone' } }),
        ExpressionAttributeValues: {
          ':zero': 0,
          ':newResetDate': resetDate,
          ':totalMin': totalMinutes,
          ':totalMsg': totalMessages,
          ...(timezoneUpdated && { ':tz': userTimezone }),
        },
      }));

      timezoneUpdated = false; // Already persisted
      console.log(`[USERS] ✓ Usage reset for new month`);
    }

    // If timezone was updated but no reset happened, persist it separately
    if (timezoneUpdated) {
      await db.send(new UpdateCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: { user_id: userId },
        UpdateExpression: 'SET #tz = :tz',
        ExpressionAttributeNames: { '#tz': 'timezone' },
        ExpressionAttributeValues: { ':tz': userTimezone },
      }));
    }

    const hasApiKey = !!user.byokApiKey;
    const isByok = hasApiKey;
    const isActive = hasApiKey;
    const usageData = {
      userId,
      plan,
      isByok,
      isActive,
      hasApiKey,
      minutes: hasApiKey
        ? { used: 0, total: -1, remaining: -1, percentageUsed: 0 }
        : {
            used: usedMinutes,
            total: totalMinutes,
            remaining: Math.max(0, totalMinutes - usedMinutes),
            percentageUsed: Math.round((usedMinutes / totalMinutes) * 100),
          },
      messages: hasApiKey
        ? { used: 0, total: -1, remaining: -1, percentageUsed: 0 }
        : {
            used: usedMessages,
            total: totalMessages,
            remaining: Math.max(0, totalMessages - usedMessages),
            percentageUsed: Math.round((usedMessages / totalMessages) * 100),
          },
      resetDate,
      createdAt: user.createdAt,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[USERS] ✓ Usage data returned for user ${userId}:`, {
      plan,
      isByok,
      minutesUsed: usedMinutes,
      messagesUsed: usedMessages,
    });
    return buildHonoSuccess(c, usageData, 'Usage statistics retrieved');
  } catch (error: any) {
    console.error(`[USERS] ✗ Error in GET /users/usage:`, error);
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * PUT /users/demographics - Update user demographic information
 * Body: { ageRange, gender, occupation, discoverySource }
 * Returns: Updated user object with demographics
 * Note: Auth is handled via Bearer token in Authorization header
 */
app.put('/users/demographics', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  let body: any = {};

  try {
    body = await c.req.json();
    console.log('[USERS] Request body parsed:', { bodyKeys: Object.keys(body) });
  } catch (e) {
    console.error('[USERS] Failed to parse request body:', e);
    return c.json({ success: false, error: 'Invalid request body' }, 400);
  }

  const { userId } = auth;

  try {
    console.log(`[USERS] ✓ PUT /users/demographics - userId: ${userId}`);
    console.log(`[USERS] Demographics data received:`, body);

    // Validate required fields
    const { ageRange, gender, occupation, discoverySource } = body;
    if (!ageRange || !gender || !occupation || !discoverySource) {
      console.warn(`[USERS] Missing required demographic fields`);
      return c.json(
        {
          success: false,
          error: 'Missing required fields: ageRange, gender, occupation, discoverySource',
        },
        400
      );
    }

    // Fetch existing user
    const userResult = await db.send(new GetCommand({
      TableName: process.env.USERS_TABLE_NAME || 'users',
      Key: {
        user_id: userId,
      },
    }));

    if (!userResult.Item) {
      console.warn(`[USERS] User not found for demographics update`);
      return c.json(
        {
          success: false,
          error: 'User not found',
        },
        404
      );
    }

    // Merge demographics into existing user record
    const updatedUser = {
      ...userResult.Item,
      demographics: {
        ageRange,
        gender,
        occupation,
        discoverySource,
        submittedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    // Save updated user
    await db.send(new PutCommand({
      TableName: process.env.USERS_TABLE_NAME || 'users',
      Item: updatedUser,
    }));

    console.log(`[USERS] ✓ Demographics updated for user ${userId}`);

    // Return success response
    return buildHonoSuccess(c, {
      user_id: userId,
      demographics: updatedUser.demographics,
      message: 'Demographics saved successfully',
    }, 'User demographics updated successfully');
  } catch (error: any) {
    console.error(`[USERS] ✗ Error in PUT /users/demographics:`, error);
    return buildHonoErrorResponse(c, error);
  }
});

app.delete('/users/unregister', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;

    // Delete primary user record
    await db.send(new DeleteCommand({
      TableName: process.env.USERS_TABLE_NAME || 'users',
      Key: { user_id: userId },
    }));

    // Cascading delete of related data (best-effort)
    const deleteTasks = [
      batchDeleteByPartitionKey(db, process.env.MESSAGES_TABLE_NAME, 'user_id', userId, 'composite_key'),
      batchDeleteByPartitionKey(db, process.env.CALLS_TABLE_NAME, 'user_id', userId, 'call_id'),
      batchDeleteByPartitionKey(db, process.env.QUEST_SESSIONS_TABLE_NAME, 'pk', `USER#${userId}`, 'sk'),
      batchDeleteByPartitionKey(db, process.env.USER_ACTIVITY_TABLE_NAME, 'user_id', userId, 'timestamp'),
      batchDeleteByPartitionKey(db, process.env.USER_STREAKS_TABLE_NAME, 'user_id', userId, 'streak_type'),
      batchDeleteByPartitionKey(db, process.env.USER_ACHIEVEMENTS_TABLE_NAME, 'user_id', userId, 'achievement_id'),
      batchDeleteByPartitionKey(db, process.env.SUBSCRIPTION_AUDIT_TABLE_NAME, 'user_id', userId, 'timestamp'),
    ];

    const results = await Promise.allSettled(deleteTasks);
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`[USERS] Cascading delete: ${failures.length} secondary tables had errors (user record already deleted)`);
    }

    return buildHonoSuccess(c, null, 'User unregistered successfully');
  } catch (error: any) {
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * Helper: batch delete all items with a given partition key from a table.
 * Best-effort: logs errors but doesn't throw.
 */
async function batchDeleteByPartitionKey(
  db: DynamoDBDocumentClient,
  tableName: string | undefined,
  pkName: string,
  pkValue: string,
  skName: string,
): Promise<void> {
  if (!tableName) return;

  try {
    let lastEvaluatedKey: any = undefined;

    do {
      const result = await db.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: `${pkName} = :pk`,
        ExpressionAttributeValues: { ':pk': pkValue },
        ProjectionExpression: `${pkName}, ${skName}`,
        ExclusiveStartKey: lastEvaluatedKey,
      }));

      const items = result.Items || [];
      lastEvaluatedKey = result.LastEvaluatedKey;

      // BatchWrite in chunks of 25 (DynamoDB limit)
      for (let i = 0; i < items.length; i += 25) {
        const batch = items.slice(i, i + 25);
        await db.send(new BatchWriteCommand({
          RequestItems: {
            [tableName]: batch.map(item => ({
              DeleteRequest: {
                Key: { [pkName]: item[pkName], [skName]: item[skName] },
              },
            })),
          },
        }));
      }
    } while (lastEvaluatedKey);
  } catch (error) {
    console.error(`[USERS] Cascading delete failed for table ${tableName}:`, error);
  }
}

/**
 * POST /users/onboarding - Submit user onboarding answers
 * Body: {
 *   selectedAgentId?: string,
 *   age?: string,
 *   gender?: string,
 *   goals?: string[],
 *   interests?: string[],
 *   preferredCoachingStyle?: string,
 *   ... (any additional fields)
 * }
 * Returns: Success message with onboarding data
 * Note: Auth is required - user must be signed in
 */
app.post('/users/onboarding', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  let body: any = {};

  try {
    body = await c.req.json();
    console.log('[USERS] Onboarding request body parsed:', { bodyKeys: Object.keys(body) });
  } catch (e) {
    console.error('[USERS] Failed to parse onboarding request body:', e);
    return c.json({ success: false, error: 'Invalid request body' }, 400);
  }

  const { userId } = auth;

  try {
    console.log(`[USERS] ✓ POST /users/onboarding - userId: ${userId}`);
    console.log(`[USERS] Onboarding data received:`, body);

    // Fetch existing user or create new record
    const userResult = await db.send(new GetCommand({
      TableName: process.env.USERS_TABLE_NAME || 'users',
      Key: {
        user_id: userId,
      },
    }));

    let userRecord: Record<string, any> = userResult.Item || {};
    let isNewUser = !userResult.Item;

    if (isNewUser) {
      // Initialize default user record if doesn't exist
      console.log(`[USERS] User not found, creating new record with onboarding data`);
      const onboardingTimezone = body.timezone && isValidTimezone(body.timezone) ? body.timezone : undefined;
      const resetDate = getFirstDayOfNextMonth(onboardingTimezone);
      userRecord = {
        user_id: userId,
        plan: 'inactive',
        usedMinutes: 0,
        totalMinutes: DEFAULT_QUOTA.minutes,
        usedMessages: 0,
        totalMessages: DEFAULT_QUOTA.messages,
        resetDate,
        ...(onboardingTimezone && { timezone: onboardingTimezone }),
        createdAt: new Date().toISOString(),
      };
    }

    // Handle agent unlocking if selectedAgentId is provided
    let unlockedAgents: string[] = userRecord.unlockedAgents || [];

    if (body.selectedAgentId && !unlockedAgents.includes(body.selectedAgentId)) {
      console.log(`[USERS] Unlocking agent ${body.selectedAgentId} for user ${userId}`);
      unlockedAgents.push(body.selectedAgentId);
    }

    // Allowlist onboarding fields to prevent injection of arbitrary data
    const allowedFields = {
      ...(body.age !== undefined && { age: body.age }),
      ...(body.gender !== undefined && { gender: body.gender }),
      ...(body.goals !== undefined && { goals: body.goals }),
      ...(body.preferredLanguage !== undefined && { preferredLanguage: body.preferredLanguage }),
      ...(body.timezone !== undefined && { timezone: body.timezone }),
      ...(body.selectedAgentId !== undefined && { selectedAgentId: body.selectedAgentId }),
      ...(body.preferredCoachingStyle !== undefined && { preferredCoachingStyle: body.preferredCoachingStyle }),
      ...(body.challenges !== undefined && { challenges: body.challenges }),
    };

    // Merge onboarding data into user record
    const updatedUser = {
      ...userRecord,
      onboarding: {
        ...(userRecord.onboarding || {}),
        ...allowedFields,
        completedAt: new Date().toISOString(),
      },
      unlockedAgents,
      updatedAt: new Date().toISOString(),
    };

    // Save updated user
    await db.send(new PutCommand({
      TableName: process.env.USERS_TABLE_NAME || 'users',
      Item: updatedUser,
    }));

    console.log(`[USERS] ✓ Onboarding completed for user ${userId}`);
    console.log(`[USERS] Unlocked agents:`, unlockedAgents);

    // Update Clerk user's public metadata to mark onboarding as completed
    try {
      const { ClerkClient } = await import('../../shared/clients/clerk-client.js');
      console.log(`[USERS] Updating Clerk public metadata for user ${userId}...`);

      const metadataUpdated = await ClerkClient.updatePublicMetadata(userId, {
        hasCompletedOnboarding: true,
      });

      if (metadataUpdated) {
        console.log(`[USERS] ✓ Clerk metadata updated successfully`);
      } else {
        console.warn(`[USERS] Failed to update Clerk metadata, but onboarding data saved to DB`);
      }
    } catch (clerkError) {
      console.error(`[USERS] Error updating Clerk metadata:`, clerkError);
      // Don't fail the request - onboarding data is already saved to DynamoDB
    }

    // Return success response
    return buildHonoSuccess(c, {
      user_id: userId,
      onboarding: updatedUser.onboarding,
      unlockedAgents,
      message: 'Onboarding completed successfully',
    }, 'Onboarding data saved successfully');
  } catch (error: any) {
    console.error(`[USERS] ✗ Error in POST /users/onboarding:`, error);
    return buildHonoErrorResponse(c, error);
  }
});

// ============================================
// BYOK API KEY MANAGEMENT
// ============================================

/**
 * POST /users/api-key - Validate & store user's Gemini API key
 * Body: { apiKey: string }
 */
app.post('/users/api-key', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const body = await c.req.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return c.json({ success: false, error: 'apiKey is required' }, 400);
    }

    console.log(`[USERS] POST /users/api-key - userId: ${auth.userId}`);

    const result = await apiKeyService.storeApiKey(auth.userId, apiKey);

    if (!result.stored) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return buildHonoSuccess(c, { stored: true }, 'API key validated and stored');
  } catch (error: any) {
    console.error(`[USERS] ✗ Error in POST /users/api-key:`, error);
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * GET /users/api-key - Get masked key info (never returns full key)
 */
app.get('/users/api-key', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const keyInfo = await apiKeyService.getKeyInfo(auth.userId);
    return buildHonoSuccess(c, keyInfo, 'API key info retrieved');
  } catch (error: any) {
    console.error(`[USERS] ✗ Error in GET /users/api-key:`, error);
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * DELETE /users/api-key - Remove stored API key
 */
app.delete('/users/api-key', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    console.log(`[USERS] DELETE /users/api-key - userId: ${auth.userId}`);
    await apiKeyService.removeApiKey(auth.userId);
    return buildHonoSuccess(c, { removed: true }, 'API key removed');
  } catch (error: any) {
    console.error(`[USERS] ✗ Error in DELETE /users/api-key:`, error);
    return buildHonoErrorResponse(c, error);
  }
});

// ============================================
// CLERK WEBHOOK ENDPOINT
// ============================================

/**
 * POST /webhooks/clerk
 *
 * Webhook handler for Clerk user lifecycle events
 *
 * Events handled:
 * - user.created: Create new user record in DynamoDB
 * - user.updated: Log user updates
 * - user.deleted: Delete user record from DynamoDB
 *
 * Webhook Signature Verification:
 * - Clerk signs every webhook with HMAC-SHA256
 * - verifyWebhook() validates the signature
 * - Returns 401 if signature is invalid
 *
 * Setup:
 * 1. Add CLERK_WEBHOOK_SIGNING_SECRET to environment
 * 2. Register webhook in Clerk Dashboard at: https://<api-domain>/webhooks/clerk
 * 3. Select events: user.created, user.updated, user.deleted
 */
app.post('/webhooks/clerk', async (c) => {
  console.log('[USERS-WEBHOOK] Received webhook request');

  try {
    // Step 1: Get webhook signing secret from SecretsHelper (cached at Lambda instance level)
    let webhookSecret: string;
    try {
      webhookSecret = await SecretsHelper.getSecretValue('CLERK_WEBHOOK_SECRET');
    } catch (error: any) {
      console.error('[USERS-WEBHOOK] ✗ Failed to get webhook signing secret:', error.message);
      return c.json(
        {
          success: false,
          error: 'Webhook not configured',
        },
        500
      );
    }

    // Step 2: Verify webhook signature using Svix
    let evt: any;
    try {
      // Get the webhook payload body
      const payload = await c.req.text();

      // Get the signature headers from the request
      const headers = {
        'svix-id': c.req.header('svix-id') || '',
        'svix-timestamp': c.req.header('svix-timestamp') || '',
        'svix-signature': c.req.header('svix-signature') || '',
      };

      // Create a Svix Webhook instance with the signing secret
      const wh = new Webhook(webhookSecret);

      // Verify the webhook signature
      evt = wh.verify(payload, headers as any);
    } catch (err: any) {
      console.error('[USERS-WEBHOOK] ✗ Webhook signature verification failed:', err.message);
      return buildHonoUnauthorized(c, 'Invalid webhook signature');
    }

    console.log(`[USERS-WEBHOOK] ✓ Signature verified, event type: ${evt.type}`);

    // Step 3: Handle different event types
    switch (evt.type) {
      case 'user.created':
        return await handleUserCreated(c, evt.data);

      case 'user.updated':
        return await handleUserUpdated(c, evt.data);

      case 'user.deleted':
        return await handleUserDeleted(c, evt.data);

      default:
        console.log(`[USERS-WEBHOOK] Event type '${evt.type}' not handled, ignoring`);
        return buildHonoSuccess(c, null, `Event '${evt.type}' not handled`);
    }
  } catch (error: any) {
    console.error('[USERS-WEBHOOK] ✗ Unexpected error:', error);
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * Handle user.created event
 * Creates new user record in DynamoDB with free tier defaults
 */
async function handleUserCreated(c: any, user: any) {
  const userId = user.id;

  try {
    // Extract user information from Clerk webhook
    const email = user.email_addresses?.[0]?.email_address || null;
    const firstName = user.first_name || null;
    const lastName = user.last_name || null;
    const phoneNumber = user.phone_numbers?.[0]?.phone_number || null;
    const profileImageUrl = user.image_url || null;
    const username = user.username || null;

    console.log(`[USERS-WEBHOOK] user.created event - userId: ${userId}`);
    console.log(`[USERS-WEBHOOK] User info: email=${email}, name=${firstName} ${lastName}`);

    // Check if user already exists
    const existingUser = await db.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: { user_id: userId },
      })
    );

    if (existingUser.Item) {
      console.warn(`[USERS-WEBHOOK] User already exists: ${userId}, skipping creation`);
      return buildHonoSuccess(c, null, 'User already exists, skipped');
    }

    // Create new user record with profile information and inactive tier defaults
    const newUser = {
      // User identifiers
      user_id: userId,
      email,
      username,

      // Profile information
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      profile_image_url: profileImageUrl,

      // Usage tracking
      plan: 'inactive',
      usedMinutes: 0,
      totalMinutes: 0,
      usedMessages: 0,
      totalMessages: 0,

      // Subscription and dates
      resetDate: getFirstDayOfNextMonth(),
      createdAt: new Date().toISOString(),
      createdVia: 'webhook',

      // Timestamps
      clerkCreatedAt: user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString(),
      lastUpdated: new Date().toISOString(),

      // Status flags
      isActive: false,
      hasCompletedOnboarding: false,
    };

    console.log(`[USERS-WEBHOOK] Creating new user record:`, {
      user_id: userId,
      email,
      name: `${firstName} ${lastName}`,
      plan: newUser.plan,
      totalMinutes: newUser.totalMinutes,
      totalMessages: newUser.totalMessages,
    });

    // Save to DynamoDB
    await db.send(
      new PutCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Item: newUser,
      })
    );

    console.log(`[USERS-WEBHOOK] ✓ User created successfully: ${userId}`);

    return buildHonoSuccess(c, { user_id: userId, email }, 'User record created');
  } catch (error: any) {
    console.error(`[USERS-WEBHOOK] ✗ Error creating user ${userId}:`, error);
    return buildHonoErrorResponse(c, error);
  }
}

/**
 * Handle user.updated event
 * Syncs profile information changes from Clerk to DynamoDB
 * Preserves usage tracking and other data
 */
async function handleUserUpdated(c: any, user: any) {
  const userId = user.id;

  try {
    console.log(`[USERS-WEBHOOK] user.updated event - userId: ${userId}`);

    // Extract updated user information from Clerk webhook
    const email = user.email_addresses?.[0]?.email_address || null;
    const firstName = user.first_name || null;
    const lastName = user.last_name || null;
    const phoneNumber = user.phone_numbers?.[0]?.phone_number || null;
    const profileImageUrl = user.image_url || null;
    const username = user.username || null;

    console.log(`[USERS-WEBHOOK] Updated profile info - email: ${email}, name: ${firstName} ${lastName}`);

    // Fetch existing user record to preserve usage data
    const existingUserResult = await db.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: { user_id: userId },
      })
    );

    if (!existingUserResult.Item) {
      console.warn(`[USERS-WEBHOOK] User not found for update: ${userId}, skipping`);
      return buildHonoSuccess(c, null, 'User not found, skipped');
    }

    // Merge updated profile information with existing data
    // Preserve: usage tracking, plan, dates, and other metadata
    const updatedUser = {
      ...existingUserResult.Item,
      // Update profile information
      email,
      username,
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      profile_image_url: profileImageUrl,
      // Update timestamp
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[USERS-WEBHOOK] Updating user profile - userId: ${userId}`);

    // Save updated user record
    await db.send(
      new PutCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Item: updatedUser,
      })
    );

    console.log(`[USERS-WEBHOOK] ✓ User profile updated successfully: ${userId}`);

    return buildHonoSuccess(c, { user_id: userId, email }, 'User profile updated');
  } catch (error: any) {
    console.error(`[USERS-WEBHOOK] ✗ Error handling user update ${userId}:`, error);
    return buildHonoErrorResponse(c, error);
  }
}

/**
 * Handle user.deleted event
 * Deletes user record from DynamoDB
 */
async function handleUserDeleted(c: any, user: any) {
  const userId = user.id;

  try {
    console.log(`[USERS-WEBHOOK] user.deleted event - userId: ${userId}`);

    // Delete user record from DynamoDB
    await db.send(
      new DeleteCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: { user_id: userId },
      })
    );

    console.log(`[USERS-WEBHOOK] ✓ User deleted successfully: ${userId}`);

    return buildHonoSuccess(c, null, 'User deleted');
  } catch (error: any) {
    console.error(`[USERS-WEBHOOK] ✗ Error deleting user ${userId}:`, error);
    return buildHonoErrorResponse(c, error);
  }
}

// ============================================
// REVENUECAT WEBHOOK ENDPOINT
// ============================================

/**
 * POST /webhooks/revenuecat
 *
 * Webhook handler for RevenueCat subscription events
 *
 * Events handled:
 * - INITIAL_PURCHASE: User purchases a subscription
 * - RENEWAL: Subscription renews successfully
 * - CANCELLATION: User cancels subscription (downgrade at period end)
 * - EXPIRATION: Subscription expires
 * - PRODUCT_CHANGE: User upgrades/downgrades subscription
 *
 * Webhook Signature Verification:
 * - RevenueCat signs webhooks with HMAC-SHA256
 * - Signature in X-RevenueCat-Signature header
 * - Returns 401 if signature is invalid
 *
 * Setup:
 * 1. Add REVENUECAT_WEBHOOK_SECRET to Secrets Manager
 * 2. Register webhook in RevenueCat Dashboard at: https://<api-domain>/webhooks/revenuecat
 * 3. Select events: Initial Purchase, Renewal, Cancellation, Expiration, Product Change
 */
app.post('/webhooks/revenuecat', async (c) => {
  console.log('[REVENUECAT-WEBHOOK] Received webhook request');

  try {
    // Step 1: Get webhook secret
    let webhookSecret: string;
    try {
      webhookSecret = await SecretsHelper.getSecretValue('REVENUECAT_WEBHOOK_SECRET');
    } catch (error: any) {
      console.error('[REVENUECAT-WEBHOOK] ✗ Failed to get webhook secret:', error.message);
      return c.json(
        {
          success: false,
          error: 'Webhook not configured',
        },
        500
      );
    }

    // Step 2: Verify Authorization header
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      console.error('[REVENUECAT-WEBHOOK] ✗ Missing Authorization header');
      return buildHonoUnauthorized(c, 'Missing Authorization header');
    }

    const expectedAuth = `Bearer ${webhookSecret}`;

    if (authHeader !== expectedAuth) {
      console.error('[REVENUECAT-WEBHOOK] ✗ Invalid Authorization header');
      return buildHonoUnauthorized(c, 'Invalid Authorization header');
    }

    console.log('[REVENUECAT-WEBHOOK] ✓ Authorization verified');

    // Get payload for parsing
    const payload = await c.req.text();

    let event: any;
    try {
      event = JSON.parse(payload);
    } catch (err) {
      console.error('[REVENUECAT-WEBHOOK] ✗ Invalid JSON payload');
      return c.json({ success: false, error: 'Invalid JSON' }, 400);
    }

    const eventType = event.event?.type;
    console.log(`[REVENUECAT-WEBHOOK] Event type: ${eventType}`);

    // Step 3: Push to SQS for async processing (if queue configured)
    const queueUrl = process.env.WEBHOOK_QUEUE_URL;

    if (queueUrl) {
      try {
        await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify({ source: 'revenuecat', event }),
            MessageAttributes: {
              eventType: {
                DataType: 'String',
                StringValue: eventType || 'UNKNOWN',
              },
            },
          })
        );

        console.log(`[REVENUECAT-WEBHOOK] ✓ Event ${eventType} queued for processing`);
        return buildHonoSuccess(c, { queued: true, eventType }, 'Event queued');
      } catch (sqsError: any) {
        console.error('[REVENUECAT-WEBHOOK] ✗ Failed to queue event, falling back to sync:', sqsError.message);
        // Fall through to synchronous processing
      }
    }

    // Fallback: synchronous processing (when SQS is not configured or queue send fails)
    switch (eventType) {
      case 'INITIAL_PURCHASE':
        return await handleInitialPurchase(c, event);
      case 'RENEWAL':
        return await handleRenewal(c, event);
      case 'CANCELLATION':
        return await handleCancellation(c, event);
      case 'EXPIRATION':
        return await handleExpiration(c, event);
      case 'PRODUCT_CHANGE':
        return await handleProductChange(c, event);
      case 'BILLING_ISSUE':
        return await handleBillingIssue(c, event);
      default:
        console.log(`[REVENUECAT-WEBHOOK] Event type '${eventType}' not handled, ignoring`);
        return buildHonoSuccess(c, null, `Event '${eventType}' not handled`);
    }
  } catch (error: any) {
    console.error('[REVENUECAT-WEBHOOK] ✗ Unexpected error:', error);
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * Helper function to extract user ID from RevenueCat webhook event
 * Checks app_user_id, original_app_user_id, and aliases array
 *
 * This handles edge cases where:
 * - User migrates from anonymous to logged-in
 * - Multiple user IDs exist for same customer
 * - Subscription transfers between accounts
 */
function extractUserId(event: any): string | null {
  const appUserId = event.event?.app_user_id;
  const originalAppUserId = event.event?.original_app_user_id;
  const aliases = event.event?.aliases;

  // Priority order: app_user_id -> original_app_user_id -> first alias
  if (appUserId && typeof appUserId === 'string' && appUserId.trim() !== '') {
    console.log(`[REVENUECAT-WEBHOOK] Using app_user_id: ${appUserId}`);
    return appUserId;
  }

  if (originalAppUserId && typeof originalAppUserId === 'string' && originalAppUserId.trim() !== '') {
    console.log(`[REVENUECAT-WEBHOOK] Fallback to original_app_user_id: ${originalAppUserId}`);
    return originalAppUserId;
  }

  if (Array.isArray(aliases) && aliases.length > 0) {
    const firstAlias = aliases[0];
    if (typeof firstAlias === 'string' && firstAlias.trim() !== '') {
      console.log(`[REVENUECAT-WEBHOOK] Fallback to first alias: ${firstAlias}`);
      return firstAlias;
    }
  }

  console.error('[REVENUECAT-WEBHOOK] No valid user ID found in event:', {
    appUserId,
    originalAppUserId,
    aliases,
  });

  return null;
}

/**
 * Helper function to map RevenueCat product ID to plan tier
 */
function getProductTier(productId: string): 'inactive' | 'byok' {
  const productLower = productId.toLowerCase();

  if (productLower.includes('byok')) {
    return 'byok';
  }

  // Legacy pro/premium products map to inactive
  return 'inactive';
}

/**
 * Helper function to get usage limits based on plan
 */
function getUsageLimits(plan: 'inactive' | 'byok'): { totalMinutes: number; totalMessages: number } {
  const quota = getQuotaForPlan(plan);
  return { totalMinutes: quota.minutes, totalMessages: quota.messages };
}

/**
 * Handle INITIAL_PURCHASE event
 * User purchases a subscription for the first time
 */
async function handleInitialPurchase(c: any, event: any) {
  try {
    const appUserId = extractUserId(event);
    const productId = event.event?.product_id;
    const expiresDate = event.event?.expiration_at_ms;

    console.log('[REVENUECAT-WEBHOOK] INITIAL_PURCHASE:', { appUserId, productId, expiresDate });

    if (!appUserId) {
      console.error('[REVENUECAT-WEBHOOK] No valid user ID found in webhook event');
      return c.json({ success: false, error: 'Missing user identification' }, 400);
    }

    if (!productId) {
      console.error('[REVENUECAT-WEBHOOK] Missing product_id');
      return c.json({ success: false, error: 'Missing product_id' }, 400);
    }

    // Determine plan tier from product ID
    const plan = getProductTier(productId);
    const limits = getUsageLimits(plan);

    console.log(`[REVENUECAT-WEBHOOK] Upgrading user ${appUserId} to ${plan}`);

    // Update user record
    await db.send(
      new UpdateCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: {
          user_id: appUserId,
        },
        UpdateExpression: `
          SET #plan = :plan,
              totalMinutes = :totalMinutes,
              totalMessages = :totalMessages,
              subscriptionStatus = :status,
              subscriptionProductId = :productId,
              subscriptionExpiresAt = :expiresAt,
              lastUpdated = :now
        `,
        ExpressionAttributeNames: {
          '#plan': 'plan', // 'plan' is a reserved keyword in DynamoDB
        },
        ExpressionAttributeValues: {
          ':plan': plan,
          ':totalMinutes': limits.totalMinutes,
          ':totalMessages': limits.totalMessages,
          ':status': 'active',
          ':productId': productId,
          ':expiresAt': expiresDate ? new Date(expiresDate).toISOString() : null,
          ':now': new Date().toISOString(),
        },
      })
    );

    console.log(`[REVENUECAT-WEBHOOK] ✓ User ${appUserId} upgraded to ${plan}`);

    return buildHonoSuccess(c, { userId: appUserId, plan }, 'Subscription activated');
  } catch (error: any) {
    console.error('[REVENUECAT-WEBHOOK] ✗ Error handling INITIAL_PURCHASE:', error);
    return buildHonoErrorResponse(c, error);
  }
}

/**
 * Handle RENEWAL event
 * Subscription renews successfully
 */
async function handleRenewal(c: any, event: any) {
  try {
    const appUserId = extractUserId(event);
    const productId = event.event?.product_id;
    const expiresDate = event.event?.expiration_at_ms;

    console.log('[REVENUECAT-WEBHOOK] RENEWAL:', { appUserId, productId, expiresDate });

    if (!appUserId) {
      console.error('[REVENUECAT-WEBHOOK] No valid user ID found in webhook event');
      return c.json({ success: false, error: 'Missing user identification' }, 400);
    }

    // Update expiration date and ensure status is active
    await db.send(
      new UpdateCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: {
          user_id: appUserId,
        },
        UpdateExpression: `
          SET subscriptionStatus = :status,
              subscriptionExpiresAt = :expiresAt,
              lastUpdated = :now
        `,
        ExpressionAttributeValues: {
          ':status': 'active',
          ':expiresAt': expiresDate ? new Date(expiresDate).toISOString() : null,
          ':now': new Date().toISOString(),
        },
      })
    );

    console.log(`[REVENUECAT-WEBHOOK] ✓ Subscription renewed for user ${appUserId}`);

    return buildHonoSuccess(c, { userId: appUserId }, 'Subscription renewed');
  } catch (error: any) {
    console.error('[REVENUECAT-WEBHOOK] ✗ Error handling RENEWAL:', error);
    return buildHonoErrorResponse(c, error);
  }
}

/**
 * Handle CANCELLATION event
 * User cancels subscription (remains active until expiration)
 */
async function handleCancellation(c: any, event: any) {
  try {
    const appUserId = extractUserId(event);
    const expiresDate = event.event?.expiration_at_ms;

    console.log('[REVENUECAT-WEBHOOK] CANCELLATION:', { appUserId, expiresDate });

    if (!appUserId) {
      console.error('[REVENUECAT-WEBHOOK] No valid user ID found in webhook event');
      return c.json({ success: false, error: 'Missing user identification' }, 400);
    }

    // Mark as cancelled but keep active until expiration
    await db.send(
      new UpdateCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: {
          user_id: appUserId,
        },
        UpdateExpression: `
          SET subscriptionStatus = :status,
              subscriptionExpiresAt = :expiresAt,
              lastUpdated = :now
        `,
        ExpressionAttributeValues: {
          ':status': 'cancelled',
          ':expiresAt': expiresDate ? new Date(expiresDate).toISOString() : null,
          ':now': new Date().toISOString(),
        },
      })
    );

    console.log(`[REVENUECAT-WEBHOOK] ✓ Subscription cancelled for user ${appUserId} (active until ${new Date(expiresDate).toISOString()})`);

    return buildHonoSuccess(c, { userId: appUserId }, 'Subscription cancelled');
  } catch (error: any) {
    console.error('[REVENUECAT-WEBHOOK] ✗ Error handling CANCELLATION:', error);
    return buildHonoErrorResponse(c, error);
  }
}

/**
 * Handle EXPIRATION event
 * Subscription expires - downgrade to free tier
 */
async function handleExpiration(c: any, event: any) {
  try {
    const appUserId = extractUserId(event);

    console.log('[REVENUECAT-WEBHOOK] EXPIRATION:', { appUserId });

    if (!appUserId) {
      console.error('[REVENUECAT-WEBHOOK] No valid user ID found in webhook event');
      return c.json({ success: false, error: 'Missing user identification' }, 400);
    }

    // Downgrade to inactive tier
    const limits = getUsageLimits('inactive');

    await db.send(
      new UpdateCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: {
          user_id: appUserId,
        },
        UpdateExpression: `
          SET #plan = :plan,
              totalMinutes = :totalMinutes,
              totalMessages = :totalMessages,
              subscriptionStatus = :status,
              subscriptionExpiresAt = :expiresAt,
              lastUpdated = :now
        `,
        ExpressionAttributeNames: {
          '#plan': 'plan', // 'plan' is a reserved keyword in DynamoDB
        },
        ExpressionAttributeValues: {
          ':plan': 'inactive',
          ':totalMinutes': limits.totalMinutes,
          ':totalMessages': limits.totalMessages,
          ':status': 'expired',
          ':expiresAt': null,
          ':now': new Date().toISOString(),
        },
      })
    );

    console.log(`[REVENUECAT-WEBHOOK] ✓ User ${appUserId} downgraded to inactive tier`);

    return buildHonoSuccess(c, { userId: appUserId, plan: 'inactive' }, 'Subscription expired');
  } catch (error: any) {
    console.error('[REVENUECAT-WEBHOOK] ✗ Error handling EXPIRATION:', error);
    return buildHonoErrorResponse(c, error);
  }
}

/**
 * Handle PRODUCT_CHANGE event
 * User upgrades or downgrades subscription
 */
async function handleProductChange(c: any, event: any) {
  try {
    const appUserId = extractUserId(event);
    const newProductId = event.event?.new_product_id;
    const expiresDate = event.event?.expiration_at_ms;

    console.log('[REVENUECAT-WEBHOOK] PRODUCT_CHANGE:', { appUserId, newProductId, expiresDate });

    if (!appUserId) {
      console.error('[REVENUECAT-WEBHOOK] No valid user ID found in webhook event');
      return c.json({ success: false, error: 'Missing user identification' }, 400);
    }

    if (!newProductId) {
      console.error('[REVENUECAT-WEBHOOK] Missing new_product_id');
      return c.json({ success: false, error: 'Missing new_product_id' }, 400);
    }

    // Determine new plan tier
    const plan = getProductTier(newProductId);
    const limits = getUsageLimits(plan);

    console.log(`[REVENUECAT-WEBHOOK] Changing user ${appUserId} to ${plan}`);

    // Update user record with new plan
    await db.send(
      new UpdateCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: {
          user_id: appUserId,
        },
        UpdateExpression: `
          SET #plan = :plan,
              totalMinutes = :totalMinutes,
              totalMessages = :totalMessages,
              subscriptionStatus = :status,
              subscriptionProductId = :productId,
              subscriptionExpiresAt = :expiresAt,
              lastUpdated = :now
        `,
        ExpressionAttributeNames: {
          '#plan': 'plan', // 'plan' is a reserved keyword in DynamoDB
        },
        ExpressionAttributeValues: {
          ':plan': plan,
          ':totalMinutes': limits.totalMinutes,
          ':totalMessages': limits.totalMessages,
          ':status': 'active',
          ':productId': newProductId,
          ':expiresAt': expiresDate ? new Date(expiresDate).toISOString() : null,
          ':now': new Date().toISOString(),
        },
      })
    );

    console.log(`[REVENUECAT-WEBHOOK] ✓ User ${appUserId} changed to ${plan}`);

    return buildHonoSuccess(c, { userId: appUserId, plan }, 'Subscription updated');
  } catch (error: any) {
    console.error('[REVENUECAT-WEBHOOK] ✗ Error handling PRODUCT_CHANGE:', error);
    return buildHonoErrorResponse(c, error);
  }
}

/**
 * Handle BILLING_ISSUE event
 * Payment failed - mark subscription as billing issue
 */
async function handleBillingIssue(c: any, event: any) {
  try {
    const appUserId = extractUserId(event);

    console.log('[REVENUECAT-WEBHOOK] BILLING_ISSUE:', { appUserId });

    if (!appUserId) {
      console.error('[REVENUECAT-WEBHOOK] No valid user ID found in webhook event');
      return c.json({ success: false, error: 'Missing user identification' }, 400);
    }

    // Mark as billing issue
    await db.send(
      new UpdateCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: {
          user_id: appUserId,
        },
        UpdateExpression: `
          SET subscriptionStatus = :status,
              lastUpdated = :now
        `,
        ExpressionAttributeValues: {
          ':status': 'billing_issue',
          ':now': new Date().toISOString(),
        },
      })
    );

    console.log(`[REVENUECAT-WEBHOOK] ✓ Billing issue marked for user ${appUserId}`);

    return buildHonoSuccess(c, { userId: appUserId }, 'Billing issue recorded');
  } catch (error: any) {
    console.error('[REVENUECAT-WEBHOOK] ✗ Error handling BILLING_ISSUE:', error);
    return buildHonoErrorResponse(c, error);
  }
}

export default handle(app);
