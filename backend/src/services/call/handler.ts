import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ECSClient } from '@aws-sdk/client-ecs';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { CreateCallRequest, CreateCallResponse, DailyRoomResponse, DailyTokenResponse } from './types';
import { ClerkLambdaAuth } from '../../shared/utils/clerk-lambda-auth';
import { Mem0Client } from '../../shared/clients/mem0-client';
import { getCachedSecret } from '../../shared/utils/secrets-cache';
import { trackCallInitiated, trackCallSuccess, trackCallFailure, trackEcsTaskStarted, trackEcsTaskFailed, MetricName, publishMetric } from '../../shared/utils/metrics';
import { StandardUnit } from '@aws-sdk/client-cloudwatch';
import { RateLimiter, RateLimitPresets, getRateLimitHeaders } from '../../shared/utils/rate-limiter';
import {
  getAgentInfo,
  getExistingRoom,
  generateRoomName,
  buildExistingRoomData,
  createDailyRoom,
  createDailyToken,
  deleteDailyRoom,
  startEcsTask,
  saveRoomToDatabase,
  updateRoomInDatabase,
  saveCallToDatabase,
  updateCallStatus,
  sendBotAssignment,
  getActiveCallForUser,
  terminateExistingCall,
} from './helpers';
import { buildUserProfileContext } from '../../shared/utils/onboarding-context';
import { CORS_ALLOWED_ORIGIN } from '../../shared/utils/response-builder';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Track userId and agentId for metrics in catch block
  let userId: string | undefined;
  let sanitizedAgentId: string | undefined;

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      };
    }

    // Verify authentication and extract userId from token
    try {
      const authHeader = event.headers.Authorization || event.headers.authorization;
      const authContext = await ClerkLambdaAuth.verifyToken(authHeader);
      userId = authContext.userId;
    } catch (authError) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: authError instanceof Error ? authError.message : 'Unauthorized' }),
      };
    }

    // Parse and validate request body
    let body: CreateCallRequest;
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Request body is required' }),
        };
      }

      body = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
      };
    }

    const { agentId } = body;

    // Input validation
    if (!agentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'agentId is required' }),
      };
    }

    // Type validation
    if (typeof agentId !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'agentId must be a string' }),
      };
    }

    // Format validation - agentId should not be empty after trimming
    sanitizedAgentId = agentId.trim();
    if (sanitizedAgentId.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'agentId cannot be empty' }),
      };
    }

    // Length validation - prevent excessively long IDs
    if (sanitizedAgentId.length > 100) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'agentId is too long (max 100 characters)' }),
      };
    }

    // Pattern validation - alphanumeric, hyphens, underscores only
    const agentIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!agentIdPattern.test(sanitizedAgentId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'agentId contains invalid characters (only alphanumeric, hyphens, and underscores allowed)' }),
      };
    }

    console.log(`[CallHandler] Validated request - userId: ${userId}, agentId: ${sanitizedAgentId}`);

    // Initialize DynamoDB for room tracking and rate limiting
    const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
    const db = DynamoDBDocumentClient.from(dbClient);

    // Pre-fetch user record and verify BYOK subscription
    let userGoogleApiKey: string | undefined;
    let prefetchedUserItem: any = null;
    try {
      const prefetchResult = await db.send(
        new GetCommand({
          TableName: process.env.USERS_TABLE_NAME || 'users',
          Key: { user_id: userId },
        })
      );
      prefetchedUserItem = prefetchResult.Item || null;

      if (!prefetchedUserItem?.byokApiKey) {
        console.warn(`[CallHandler] User ${userId} has no API key stored`);
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'API key required. Please add your Google Gemini API key to continue.',
            errorCode: 'API_KEY_REQUIRED',
          }),
        };
      }

      userGoogleApiKey = prefetchedUserItem.byokApiKey;
      console.log('[CallHandler] BYOK user verified, using user API key');
    } catch (err) {
      console.warn('[CallHandler] Failed to pre-fetch user record:', err);
    }

    // === RATE LIMITING ===
    // Check rate limit before proceeding (prevents abuse)
    const rateLimiter = new RateLimiter(db, process.env.RATE_LIMIT_TABLE_NAME || 'rate-limits');
    const rateLimitResult = await rateLimiter.checkLimit(userId, RateLimitPresets.CALL_CREATE);

    if (!rateLimitResult.allowed) {
      console.warn(`[CallHandler] Rate limit exceeded for user ${userId}`);
      return {
        statusCode: 429,
        headers: {
          ...headers,
          ...getRateLimitHeaders(rateLimitResult),
        },
        body: JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Too many call requests.',
          retryAfter: rateLimitResult.retryAfter,
          resetAt: new Date(rateLimitResult.resetAt).toISOString(),
        }),
      };
    }

    // Add rate limit headers to response
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    // BYOK users have unlimited usage — no quota check needed
    console.log('[CallHandler] BYOK user - unlimited usage');
    const quotaCheck = { hasQuota: true, usedMinutes: 0, totalMinutes: 999999, remainingMinutes: 999, resetDate: '' };

    // === CHECK FOR EXISTING ACTIVE CALL ===
    // Prevent multiple simultaneous bots by terminating any existing active call
    const ecsClient = new ECSClient({ region: process.env.AWS_REGION });
    const activeCall = await getActiveCallForUser(db, userId);

    if (activeCall) {
      console.log(
        `[CallHandler] Found existing active call ${activeCall.call_id} (status: ${activeCall.status}) - ` +
        `gracefully terminating before starting new call`
      );
      await terminateExistingCall(db, ecsClient, activeCall);
      // Small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`[CallHandler] ✓ Previous call terminated, proceeding with new call`);
    }

    // Track call initiation
    await trackCallInitiated(sanitizedAgentId, userId);

    // Get Daily.co API key from Secrets Manager (with caching)
    const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
    const secretName = process.env.APP_SECRET_NAME || '';

    const secrets = await getCachedSecret(
      secretName,
      async () => {
        console.log('[CallHandler] Fetching secrets from Secrets Manager...');
        const secretResponse = await secretsClient.send(
          new GetSecretValueCommand({
            SecretId: secretName,
          })
        );
        return JSON.parse(secretResponse.SecretString || '{}');
      },
      5 * 60 * 1000 // Cache for 5 minutes
    );

    const dailyApiKey = secrets.DAILY_API_KEY;

    if (!dailyApiKey) {
      throw new Error('Daily.co API key not found in secrets');
    }

    // Fetch agent information
    const agentInfo = await getAgentInfo(db, sanitizedAgentId);
    if (!agentInfo) {
      throw new Error(`Agent ${sanitizedAgentId} not found`);
    }

    // === FETCH USER PROFILE DATA FOR PERSONALIZATION (ONBOARDING + ASSESSMENTS) ===
    let userProfileContext: string | null = null;
    try {
      // Re-use pre-fetched user item if available, otherwise fetch fresh
      const userItem = prefetchedUserItem || (await db.send(
        new GetCommand({
          TableName: process.env.USERS_TABLE_NAME || 'users',
          Key: { user_id: userId },
        })
      )).Item;

      if (userItem) {
        const userName = userItem.first_name || null;
        userProfileContext = buildUserProfileContext(
          {
            onboarding: userItem.onboarding,
            assessments: userItem.assessments,
            userName,
          },
          null,
          sanitizedAgentId
        );
        console.log(`[CallHandler] User profile context built (${userProfileContext?.length || 0} chars, name: ${userName || 'none'}, hasAssessment: ${!!userItem.assessments?.[sanitizedAgentId]})`);
      }
    } catch (err) {
      console.warn('[CallHandler] Failed to fetch user profile data:', err);
    }

    // === FETCH RECENT MEMORIES FROM MEM0 ===
    console.log(`Fetching memories for user ${userId} and agent ${sanitizedAgentId}`);

    let memoryContext = '';
    try {
      const memories = await Mem0Client.search(
        `Recent conversations and interactions with ${agentInfo.name}`,
        userId,
        sanitizedAgentId,
        {
          threshold: 0.3,
          // Note: Removed unsupported filters (importance, created_at)
          // Mem0 only supports filtering by: user_id, agent_id, app_id, run_id, categories
          // Semantic search with threshold handles relevance filtering
        }
      );

      memoryContext = Mem0Client.formatMemories(memories);
      console.log(`Retrieved ${memories.length} memories for call context`);
    } catch (memoryError) {
      // Log warning but continue with empty memory context
      // This ensures call initialization doesn't fail due to Mem0 issues
      console.warn('[CallHandler] Failed to fetch memories from Mem0, continuing with empty context:', memoryError);
    }

    // Add user profile context to memory context
    if (userProfileContext) {
      memoryContext = userProfileContext + (memoryContext ? '\n\n' + memoryContext : '');
      console.log('[CallHandler] ✓ User profile context added to memory context');
    }

    // Check if room already exists for this user-agent pair
    const existingRoom = await getExistingRoom(db, userId, sanitizedAgentId);
    const roomReused = !!existingRoom;

    // Track room reuse metric
    if (roomReused) {
      await publishMetric(MetricName.DAILY_ROOM_REUSED, 1, StandardUnit.Count, {
        AgentId: sanitizedAgentId,
        UserId: userId,
      });
    }

    // Determine room name
    const uniqueRoomName = existingRoom ? existingRoom.daily_room_name : generateRoomName(userId, sanitizedAgentId);

    // Create Daily.co room only if not reused
    const roomData: DailyRoomResponse = existingRoom
      ? buildExistingRoomData(existingRoom)
      : await createDailyRoom(uniqueRoomName, dailyApiKey);

    // Create user token for the room
    let tokenData: DailyTokenResponse;
    let botTokenData: DailyTokenResponse;
    try {
      tokenData = await createDailyToken(uniqueRoomName, userId, dailyApiKey, false);
      botTokenData = await createDailyToken(uniqueRoomName, userId, dailyApiKey, true);
    } catch (error) {
      // If token creation fails for a newly created room, cleanup Daily.co room
      if (!existingRoom) {
        await deleteDailyRoom(uniqueRoomName, dailyApiKey);
      }
      throw error;
    }

    // Generate call ID and create call entry first (before starting ECS task or sending SQS)
    const callId = await saveCallToDatabase(
      db,
      userId,
      sanitizedAgentId,
      agentInfo.name,
      agentInfo.avatar || null,
      '' // taskArn will be updated if using cold start
    );

    // ⚡ WARM POOL MODE: Use SQS assignment queue for instant bot assignment
    const enableWarmPool = process.env.ENABLE_WARM_POOL === 'true';
    const botAssignmentsQueueUrl = process.env.BOT_ASSIGNMENTS_QUEUE_URL;

    let taskArn = '';
    let assignmentMethod: 'warm-pool' | 'cold-start' = 'cold-start';

    if (enableWarmPool && botAssignmentsQueueUrl) {
      console.log('[CallHandler] Using warm pool mode - sending assignment to SQS');

      try {
        // Send assignment to warm pool via SQS
        const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

        await sendBotAssignment(sqsClient, botAssignmentsQueueUrl, {
          callId,
          userId,
          agentId: sanitizedAgentId,
          roomUrl: roomData.url,
          roomName: uniqueRoomName,
          botToken: botTokenData.token,
          agentInfo,
          memoryContext,
          remainingMinutes: quotaCheck.remainingMinutes,
          userGoogleApiKey,
        });

        assignmentMethod = 'warm-pool';
        taskArn = 'warm-pool-pending'; // Placeholder - warm pool tasks aren't tracked by ARN

        console.log(`[CallHandler] ✅ Bot assignment sent to warm pool for call ${callId}`);
      } catch (sqsError) {
        console.error('[CallHandler] ⚠️  Warm pool assignment failed, falling back to cold start:', sqsError);

        // Fall back to cold start ECS task
        const ecsClient = new ECSClient({ region: process.env.AWS_REGION });

        try {
          taskArn = await startEcsTask(
            ecsClient,
            roomData.url,
            uniqueRoomName,
            agentInfo,
            userId,
            callId,
            botTokenData.token,
            memoryContext,
            quotaCheck.remainingMinutes,
            userGoogleApiKey
          );

          assignmentMethod = 'cold-start';
          await trackEcsTaskStarted(sanitizedAgentId);
        } catch (ecsError) {
          const errorType = ecsError instanceof Error ? ecsError.message : 'Unknown';
          await trackEcsTaskFailed(sanitizedAgentId, errorType);

          if (!existingRoom) {
            await deleteDailyRoom(uniqueRoomName, dailyApiKey);
          }
          throw ecsError;
        }
      }
    } else {
      // COLD START MODE: Traditional ECS task per call
      console.log('[CallHandler] Using cold start mode - launching new ECS task');

      const ecsClient = new ECSClient({ region: process.env.AWS_REGION });

      try {
        taskArn = await startEcsTask(
          ecsClient,
          roomData.url,
          uniqueRoomName,
          agentInfo,
          userId,
          callId,
          botTokenData.token,
          memoryContext,
          quotaCheck.remainingMinutes
        );

        assignmentMethod = 'cold-start';
        await trackEcsTaskStarted(sanitizedAgentId);
      } catch (error) {
        const errorType = error instanceof Error ? error.message : 'Unknown';
        await trackEcsTaskFailed(sanitizedAgentId, errorType);

        if (!existingRoom) {
          await deleteDailyRoom(uniqueRoomName, dailyApiKey);
        }
        throw error;
      }
    }

    // Update call status to in_progress
    await updateCallStatus(db, userId, callId, 'in_progress');

    // Save/update room in database
    if (!existingRoom) {
      await saveRoomToDatabase(db, userId, sanitizedAgentId, roomData, taskArn);
    } else {
      await updateRoomInDatabase(db, userId, sanitizedAgentId, taskArn);
    }

    const response: CreateCallResponse = {
      success: true,
      data: {
        callId,
        roomUrl: roomData.url,
        roomName: uniqueRoomName,
        userToken: tokenData.token,
        taskArn,
        roomReused,
        assignmentMethod, // NEW: Indicates if warm-pool or cold-start was used
        quota: { unlimited: true },
      },
    };

    // Track successful call initiation
    if (userId && sanitizedAgentId) {
      await trackCallSuccess(sanitizedAgentId, userId, 0); // Duration will be tracked on call end
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        ...rateLimitHeaders,
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error creating call:', error);

    // Track failed call
    if (userId && sanitizedAgentId) {
      const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
      await trackCallFailure(sanitizedAgentId, userId, errorType);
    }

    const response: CreateCallResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(response),
    };
  }
};
