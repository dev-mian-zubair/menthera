import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ECSClient, RunTaskCommand, ListTasksCommand, DescribeTasksCommand, StopTaskCommand } from '@aws-sdk/client-ecs';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { AgentInfo, DailyRoomResponse, DailyTokenResponse, CallRecord } from './types';
import { retryWithBackoff } from '../../shared/utils/retry';
import { executeWithCircuitBreaker } from '../../shared/utils/circuit-breaker';
import { trackDailyApiLatency, trackEcsTaskCount, MetricName, publishMetric } from '../../shared/utils/metrics';
import { StandardUnit } from '@aws-sdk/client-cloudwatch';
import { DEFAULT_QUOTA } from '../../shared/config/quotas.config';
import { DAILY_API_RETRY_CONFIG, ECS_CIRCUIT_BREAKER_CONFIG, GRACEFUL_SHUTDOWN_CONFIG } from '../../shared/config/timeouts.config';
import { DEFAULT_VOICE_CONFIG } from '../../shared/config/voice.config';

// Re-export types for convenience
export type { AgentInfo, DailyRoomResponse, DailyTokenResponse, CallRecord };

// ECS Task Limits Configuration
const MAX_CONCURRENT_TASKS = parseInt(process.env.MAX_CONCURRENT_ECS_TASKS || '50', 10);

/**
 * Check the number of currently running ECS tasks
 */
export async function getRunningTaskCount(ecsClient: ECSClient): Promise<number> {
  try {
    const clusterArn = process.env.ECS_CLUSTER_ARN;
    if (!clusterArn) {
      throw new Error('ECS_CLUSTER_ARN not configured');
    }

    // List all running and pending tasks
    const listTasksResponse = await ecsClient.send(
      new ListTasksCommand({
        cluster: clusterArn,
        desiredStatus: 'RUNNING', // Only count RUNNING tasks, not STOPPED
      })
    );

    const taskCount = listTasksResponse.taskArns?.length || 0;
    console.log(`[getRunningTaskCount] Found ${taskCount} running ECS tasks`);

    // Track ECS task count metric
    await trackEcsTaskCount(taskCount);

    return taskCount;
  } catch (error) {
    console.error('[getRunningTaskCount] Error counting tasks:', error);
    // Return 0 to allow task creation if we can't determine the count
    // This prevents blocking all calls if ECS API has issues
    return 0;
  }
}

/**
 * Check if we can start a new ECS task (respects MAX_CONCURRENT_TASKS limit)
 */
export async function canStartNewTask(ecsClient: ECSClient): Promise<{ allowed: boolean; currentCount: number; maxCount: number }> {
  const currentCount = await getRunningTaskCount(ecsClient);
  const allowed = currentCount < MAX_CONCURRENT_TASKS;

  console.log(`[canStartNewTask] Current: ${currentCount}, Max: ${MAX_CONCURRENT_TASKS}, Allowed: ${allowed}`);

  return {
    allowed,
    currentCount,
    maxCount: MAX_CONCURRENT_TASKS,
  };
}

/**
 * Fetch agent information by agent ID
 */
export async function getAgentInfo(
  db: DynamoDBDocumentClient,
  agentId: string
): Promise<AgentInfo | null> {
  try {
    // Use Query instead of GetCommand since we don't know the agent_type (sort key)
    const result = await db.send(
      new QueryCommand({
        TableName: process.env.AGENTS_TABLE_NAME || 'agents',
        KeyConditionExpression: 'agent_id = :agentId',
        ExpressionAttributeValues: {
          ':agentId': String(agentId),
        },
        Limit: 1,
      })
    );

    if (result.Items && result.Items.length > 0) {
      const item = result.Items[0];
      return {
        agent_id: item.agent_id,
        name: item.name,
        agent_type: item.agent_type,
        description: item.description,
        avatar: item.avatar,
        voice_id: item.voice_id,
        voice_emotion: item.voice_emotion,
        call_prompt: item.call_prompt,
        message_prompt: item.message_prompt,
      } as AgentInfo;
    }

    return null;
  } catch (error) {
    console.warn(`Error fetching agent ${agentId}:`, error);
    return null;
  }
}

/**
 * Check if user has sufficient minutes remaining for a call
 * Returns quota information or throws error if user not found
 */
export async function checkUserQuota(
  db: DynamoDBDocumentClient,
  userId: string
): Promise<{
  hasQuota: boolean;
  usedMinutes: number;
  totalMinutes: number;
  remainingMinutes: number;
  resetDate: string;
}> {
  try {
    const response = await db.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: { user_id: userId },
      })
    );

    if (!response.Item) {
      throw new Error('User not found');
    }

    const user = response.Item;
    const usedMinutes = user.usedMinutes || 0;
    const totalMinutes = user.totalMinutes || DEFAULT_QUOTA.minutes;
    const remainingMinutes = Math.max(0, totalMinutes - usedMinutes);
    const hasQuota = remainingMinutes > 0;

    console.log(
      `[QuotaCheck] User ${userId}: ${usedMinutes}/${totalMinutes} minutes used, ` +
      `${remainingMinutes} remaining (hasQuota: ${hasQuota})`
    );

    return {
      hasQuota,
      usedMinutes,
      totalMinutes,
      remainingMinutes,
      resetDate: user.resetDate || new Date().toISOString(),
    };
  } catch (error) {
    console.error('[QuotaCheck] Error checking user quota:', error);
    throw error;
  }
}

/**
 * Get any active call for a user (status: initiated, in_progress, or ending)
 * Used to prevent multiple simultaneous calls/bots for the same user
 */
export async function getActiveCallForUser(
  db: DynamoDBDocumentClient,
  userId: string
): Promise<CallRecord | null> {
  try {
    // Query calls table for this user's calls, sorted by most recent first
    const result = await db.send(
      new QueryCommand({
        TableName: process.env.CALLS_TABLE_NAME || 'calls',
        KeyConditionExpression: 'user_id = :userId',
        FilterExpression: '#status IN (:initiated, :in_progress, :ending)',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':userId': userId,
          ':initiated': 'initiated',
          ':in_progress': 'in_progress',
          ':ending': 'ending',
        },
        ScanIndexForward: false, // Most recent first
        Limit: 10, // Check recent calls only
      })
    );

    if (result.Items && result.Items.length > 0) {
      const activeCall = result.Items[0] as CallRecord;
      console.log(
        `[getActiveCallForUser] Found active call ${activeCall.call_id} for user ${userId} (status: ${activeCall.status})`
      );
      return activeCall;
    }

    console.log(`[getActiveCallForUser] No active calls found for user ${userId}`);
    return null;
  } catch (error) {
    console.error('[getActiveCallForUser] Error checking for active calls:', error);
    // Don't throw - allow the new call to proceed if we can't check
    return null;
  }
}

/**
 * Gracefully terminate an existing call before starting a new one
 * 1. Sets status to 'ending' to signal bot for graceful shutdown
 * 2. Waits briefly for bot to complete
 * 3. Force stops ECS task if needed
 * 4. Marks call as 'ended' with reason
 */
export async function terminateExistingCall(
  db: DynamoDBDocumentClient,
  ecsClient: ECSClient,
  call: CallRecord
): Promise<void> {
  const { user_id: userId, call_id: callId, task_arn: taskArn, status } = call;
  const now = new Date().toISOString();

  console.log(`[terminateExistingCall] Terminating call ${callId} (current status: ${status})`);

  try {
    // Step 1: Signal graceful shutdown by setting status to 'ending'
    if (status !== 'ending') {
      await db.send(
        new UpdateCommand({
          TableName: process.env.CALLS_TABLE_NAME || 'calls',
          Key: { user_id: userId, call_id: callId },
          UpdateExpression: 'SET #status = :status, updated_at = :now',
          ConditionExpression: '#status IN (:initiated, :in_progress)',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': 'ending',
            ':now': now,
            ':initiated': 'initiated',
            ':in_progress': 'in_progress',
          },
        })
      );
      console.log(`[terminateExistingCall] Set call ${callId} status to 'ending'`);
    }

    // Step 2: Wait briefly for graceful shutdown (shorter timeout than user-left handler)
    // We use a shorter timeout here (3s vs 10s) to not delay the new call too much
    const maxWaitTime = 3000; // 3 seconds
    const checkInterval = 500; // Check every 500ms
    let gracefulShutdownComplete = false;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));

      const checkResponse = await db.send(
        new GetCommand({
          TableName: process.env.CALLS_TABLE_NAME || 'calls',
          Key: { user_id: userId, call_id: callId },
        })
      );

      if (checkResponse.Item?.status === 'completed') {
        gracefulShutdownComplete = true;
        console.log(`[terminateExistingCall] ✓ Bot completed graceful shutdown for call ${callId}`);
        break;
      }
    }

    // Step 3: Force stop ECS task if graceful shutdown didn't complete
    if (!gracefulShutdownComplete && taskArn) {
      console.log(`[terminateExistingCall] ⚠️ Graceful shutdown timeout - force stopping ECS task for call ${callId}`);

      try {
        await ecsClient.send(
          new StopTaskCommand({
            cluster: process.env.ECS_CLUSTER_NAME || 'menthera-voice-cluster',
            task: taskArn,
            reason: 'Superseded by new call - user started another call',
          })
        );
        console.log(`[terminateExistingCall] ✓ ECS task force-stopped for call ${callId}`);
      } catch (ecsError) {
        // Task might already be stopped
        if (ecsError instanceof Error && ecsError.message.includes('not found')) {
          console.log(`[terminateExistingCall] Task already stopped for call ${callId}`);
        } else {
          console.warn(`[terminateExistingCall] Error stopping ECS task:`, ecsError);
        }
      }

      // Update status to 'ended' since bot didn't complete gracefully
      await db.send(
        new UpdateCommand({
          TableName: process.env.CALLS_TABLE_NAME || 'calls',
          Key: { user_id: userId, call_id: callId },
          UpdateExpression: 'SET #status = :status, ended_at = :endedAt, updated_at = :now, end_reason = :reason',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': 'ended',
            ':endedAt': now,
            ':now': now,
            ':reason': 'superseded_by_new_call',
          },
        })
      );
    }

    // Track metric for superseded calls
    await publishMetric(
      MetricName.CALL_SUPERSEDED,
      1,
      StandardUnit.Count,
      {
        UserId: userId,
        CallId: callId,
        GracefulShutdown: gracefulShutdownComplete ? 'true' : 'false',
      }
    );

    console.log(`[terminateExistingCall] ✓ Successfully terminated call ${callId}`);
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log(`[terminateExistingCall] Call ${callId} already in terminal state, skipping`);
    } else {
      console.error(`[terminateExistingCall] Error terminating call ${callId}:`, error);
      // Don't throw - we want to allow the new call to proceed even if cleanup fails
    }
  }
}

/**
 * Check if a room already exists for the given user-agent pair
 */
export async function getExistingRoom(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string
): Promise<any | null> {
  try {
    const result = await db.send(
      new GetCommand({
        TableName: process.env.ROOMS_TABLE_NAME || 'rooms',
        Key: {
          user_id: userId,
          agent_id: agentId,
        },
      })
    );

    if (result.Item) {
      console.log(`Room already exists for user ${userId} and agent ${agentId}, reusing...`);
      return result.Item;
    }

    return null;
  } catch (error) {
    console.warn('Error checking for existing room:', error);
    return null;
  }
}

/**
 * Generate a unique room name for a user-agent pair
 */
export function generateRoomName(userId: string, agentId: string): string {
  return `room-${userId}-${agentId}-${Date.now()}`;
}

/**
 * Build room data object from existing room record
 */
export function buildExistingRoomData(existingRoom: any): DailyRoomResponse {
  return {
    id: existingRoom.daily_room_id,
    name: existingRoom.daily_room_name,
    url: existingRoom.daily_room_url,
    api_created: true,
    privacy: 'private',
    created_at: existingRoom.created_at,
    config: {
      max_participants: 2,
      enable_chat: false,
      enable_screenshare: false,
    },
  };
}

/**
 * Create a new Daily.co room with audio-only, private settings (with retry logic)
 */
export async function createDailyRoom(
  roomName: string,
  dailyApiKey: string
): Promise<DailyRoomResponse> {
  const startTime = Date.now();

  try {
    const result = await retryWithBackoff(
      async () => {
        const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${dailyApiKey}`,
          },
          body: JSON.stringify({
            name: roomName,
            privacy: 'private',
          }),
        });

        if (!roomResponse.ok) {
          const errorText = await roomResponse.text();
          throw new Error(`Failed to create Daily.co room: ${roomResponse.status} ${errorText}`);
        }

        return (await roomResponse.json()) as DailyRoomResponse;
      },
      DAILY_API_RETRY_CONFIG
    );

    // Track successful room creation latency
    const latency = Date.now() - startTime;
    await trackDailyApiLatency('CreateRoom', latency);
    await publishMetric(MetricName.DAILY_ROOM_CREATED, 1, StandardUnit.Count);

    return result;
  } catch (error) {
    // Track latency even on failure
    const latency = Date.now() - startTime;
    await trackDailyApiLatency('CreateRoom', latency);
    throw error;
  }
}

/**
 * Create a meeting token for joining the Daily.co room (with retry logic)
 */
export async function createDailyToken(
  roomName: string,
  userId: string,
  dailyApiKey: string,
  isBot: boolean = false
): Promise<DailyTokenResponse> {
  const startTime = Date.now();

  try {
    // Calculate token expiration (24 hours from now)
    const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24h in seconds

    const result = await retryWithBackoff(
      async () => {
        const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${dailyApiKey}`,
          },
          body: JSON.stringify({
            properties: {
              room_name: roomName,
              user_id: isBot ? `bot-${Date.now()}` : (userId || `user-${Date.now()}`),
              is_owner: true,
              enable_recording: false,
              exp: expirationTime, // Token expires in 24 hours
            },
          }),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          throw new Error(`Failed to create Daily.co token: ${tokenResponse.status} ${errorText}`);
        }

        return (await tokenResponse.json()) as DailyTokenResponse;
      },
      DAILY_API_RETRY_CONFIG
    );

    // Track successful token creation latency
    const latency = Date.now() - startTime;
    await trackDailyApiLatency('CreateToken', latency);
    await publishMetric(MetricName.DAILY_TOKEN_CREATED, 1, StandardUnit.Count);

    return result;
  } catch (error) {
    // Track latency even on failure
    const latency = Date.now() - startTime;
    await trackDailyApiLatency('CreateToken', latency);
    throw error;
  }
}

/**
 * Delete a Daily.co room (cleanup on failure)
 */
export async function deleteDailyRoom(
  roomName: string,
  dailyApiKey: string
): Promise<void> {
  try {
    await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${dailyApiKey}`,
      },
    });
    console.log(`Cleaned up Daily.co room: ${roomName}`);
  } catch (error) {
    console.error(`Failed to cleanup Daily.co room ${roomName}:`, error);
    throw error;
  }
}

/**
 * Start ECS task for Pipecat bot
 */
export async function startEcsTask(
  ecsClient: ECSClient,
  roomUrl: string,
  roomName: string,
  agentInfo: AgentInfo | null,
  userId: string,
  callId: string,
  botToken: string,
  memoryContext?: string,
  remainingMinutes?: number,
  userGoogleApiKey?: string
): Promise<string> {
  // Check if we can start a new task (respects MAX_CONCURRENT_TASKS limit)
  const taskLimitCheck = await canStartNewTask(ecsClient);

  if (!taskLimitCheck.allowed) {
    const errorMsg = `Maximum concurrent ECS tasks limit reached (${taskLimitCheck.currentCount}/${taskLimitCheck.maxCount}). Please try again later.`;
    console.error(`[startEcsTask] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  console.log(`[startEcsTask] Task limit check passed: ${taskLimitCheck.currentCount}/${taskLimitCheck.maxCount} tasks running`);

  // Parse subnets from environment variable
  const subnets = process.env.ECS_SUBNETS?.split(',').filter(s => s.trim()) || [];

  console.log('[startEcsTask] Environment variables:', {
    ECS_SUBNETS: process.env.ECS_SUBNETS,
    subnetsArray: subnets,
    subnetsLength: subnets.length,
  });

  if (!subnets || subnets.length === 0) {
    throw new Error(`No subnets configured for ECS task. ECS_SUBNETS="${process.env.ECS_SUBNETS}"`);
  }

  const runTaskCommand = new RunTaskCommand({
    cluster: process.env.ECS_CLUSTER_ARN,
    taskDefinition: process.env.ECS_TASK_DEFINITION_ARN,
    launchType: 'FARGATE',
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: subnets,
        assignPublicIp: 'ENABLED',
        securityGroups: process.env.SECURITY_GROUP_ID ? [process.env.SECURITY_GROUP_ID] : undefined,
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: 'PipecatContainer',
          environment: [
            { name: 'ENVIRONMENT', value: process.env.ENVIRONMENT || 'dev' },
            { name: 'AWS_REGION', value: process.env.AWS_REGION || 'us-east-1' },
            { name: 'BOT_TYPE', value: 'flow' },
            { name: 'BOT_NAME', value: agentInfo?.name || 'Menthera Assistant' },
            { name: 'BOT_TYPE_CATEGORY', value: agentInfo?.agent_type || 'general' },
            { name: 'LLM_PROVIDER', value: 'google' },
            { name: 'STT_PROVIDER', value: 'cartesia' },
            { name: 'TTS_PROVIDER', value: 'cartesia' },
            { name: 'VOICE_ID', value: agentInfo?.voice_id || DEFAULT_VOICE_CONFIG.voiceId },
            { name: 'VOICE_EMOTION', value: agentInfo?.voice_emotion || DEFAULT_VOICE_CONFIG.emotion },
            { name: 'ENABLE_STT_MUTE_FILTER', value: 'false' },
            { name: 'DAILY_ROOM_URL', value: roomUrl },
            { name: 'DAILY_ROOM_NAME', value: roomName },
            { name: 'DAILY_BOT_TOKEN', value: botToken },
            { name: 'USER_ID', value: userId },
            { name: 'CALL_ID', value: callId },
            { name: 'AGENT_ID', value: agentInfo?.agent_id || '' },
            { name: 'AGENT_CALL_PROMPT', value: agentInfo?.call_prompt || '' },
            { name: 'MEMORY_CONTEXT', value: memoryContext || '' },
            { name: 'CALLS_TABLE_NAME', value: process.env.CALLS_TABLE_NAME || 'calls' },
            { name: 'USERS_TABLE_NAME', value: process.env.USERS_TABLE_NAME || 'users' },
            { name: 'REMAINING_MINUTES', value: remainingMinutes?.toString() || String(DEFAULT_QUOTA.minutes) },
            ...(userGoogleApiKey ? [{ name: 'USER_GOOGLE_API_KEY', value: userGoogleApiKey }] : []),
          ],
        },
      ],
    },
  });

  // Wrap ECS task creation with circuit breaker
  const taskResponse = await executeWithCircuitBreaker(
    'ecs-runTask',
    async () => {
      return await ecsClient.send(runTaskCommand);
    },
    {
      failureThreshold: ECS_CIRCUIT_BREAKER_CONFIG.failureThreshold,
      successThreshold: ECS_CIRCUIT_BREAKER_CONFIG.successThreshold,
      timeout: ECS_CIRCUIT_BREAKER_CONFIG.timeoutMs,
      monitoringPeriod: ECS_CIRCUIT_BREAKER_CONFIG.monitoringPeriodMs,
    }
  );

  if (!taskResponse.tasks || taskResponse.tasks.length === 0) {
    throw new Error('Failed to start ECS task - no tasks returned');
  }

  return taskResponse.tasks[0].taskArn || '';
}

/**
 * Save a newly created room to database
 */
export async function saveRoomToDatabase(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  roomData: DailyRoomResponse,
  taskArn: string
): Promise<void> {
  try {
    await db.send(
      new PutCommand({
        TableName: process.env.ROOMS_TABLE_NAME || 'rooms',
        Item: {
          user_id: userId,
          agent_id: agentId,
          daily_room_id: roomData.id,
          daily_room_name: roomData.name,
          daily_room_url: roomData.url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          active_sessions: 1,
          task_arn: taskArn,
        },
      })
    );
    console.log(`Room saved to database for user ${userId} and agent ${agentId}`);
  } catch (error) {
    console.warn('Error saving room to database:', error);
    // Don't fail the call if room saving fails - the call is already in progress
  }
}

/**
 * Update an existing room with latest usage info
 * Uses conditional write to ensure room exists before updating
 */
export async function updateRoomInDatabase(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  taskArn: string
): Promise<void> {
  try {
    await db.send(
      new UpdateCommand({
        TableName: process.env.ROOMS_TABLE_NAME || 'rooms',
        Key: {
          user_id: userId,
          agent_id: agentId,
        },
        UpdateExpression: 'SET last_used_at = :now, active_sessions = active_sessions + :one, task_arn = :taskArn',
        // ⚡ CONDITIONAL WRITE: Only update if room exists (prevent updates to non-existent rooms)
        ConditionExpression: 'attribute_exists(user_id) AND attribute_exists(agent_id)',
        ExpressionAttributeValues: {
          ':now': new Date().toISOString(),
          ':one': 1,
          ':taskArn': taskArn,
        },
      })
    );
    console.log(`✅ Room updated for user ${userId} and agent ${agentId}`);
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.warn(`⚠️  [RACE CONDITION] Room does not exist for user ${userId} and agent ${agentId}, skipping update`);
      // This is expected if room was deleted - don't throw
    } else {
      console.error('❌ Error updating room in database:', error);
      // Don't fail the call if room update fails - the call is already in progress
    }
  }
}

/**
 * Generate a unique call ID
 */
export function generateCallId(): string {
  return `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new call entry in the calls table with 'initiated' status
 */
export async function saveCallToDatabase(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  agentName: string,
  agentAvatar: string | null,
  taskArn: string
): Promise<string> {
  const callId = generateCallId();
  const now = new Date().toISOString();

  try {
    await db.send(
      new PutCommand({
        TableName: process.env.CALLS_TABLE_NAME || 'calls',
        Item: {
          user_id: userId,
          call_id: callId,
          agent_id: agentId,
          agent_name: agentName,
          agent_avatar: agentAvatar,
          type: 'audio',
          status: 'initiated',
          duration: 0,
          started_at: now,
          created_at: now,
          updated_at: now,
          task_arn: taskArn,
        },
      })
    );
    console.log(`Call ${callId} saved to database for user ${userId} and agent ${agentId}`);
    return callId;
  } catch (error) {
    console.warn('Error saving call to database:', error);
    throw error;
  }
}

/**
 * Update call status and duration when call completes
 * Uses conditional writes to prevent race conditions and invalid state transitions
 */
export async function updateCallStatus(
  db: DynamoDBDocumentClient,
  userId: string,
  callId: string,
  status: 'in_progress' | 'completed' | 'missed' | 'failed',
  endedAt?: string,
  duration?: number
): Promise<void> {
  try {
    const updateExpression = status === 'in_progress'
      ? 'SET #status = :status, updated_at = :now'
      : 'SET #status = :status, ended_at = :endedAt, duration = :duration, updated_at = :now';

    const expressionAttributeValues: any = {
      ':status': status,
      ':now': new Date().toISOString(),
    };

    if (status !== 'in_progress') {
      expressionAttributeValues[':endedAt'] = endedAt || new Date().toISOString();
      expressionAttributeValues[':duration'] = duration || 0;
    }

    // ⚡ CONDITIONAL WRITE: Prevent race conditions
    // Only allow state transitions that make sense:
    // - initiated -> in_progress ✅
    // - in_progress -> completed/failed/missed ✅
    // - completed -> * ❌ (final state)
    // - failed -> * ❌ (final state)
    let conditionExpression: string | undefined;

    if (status === 'in_progress') {
      // Only transition to in_progress if currently 'initiated'
      conditionExpression = '#status = :initiated';
      expressionAttributeValues[':initiated'] = 'initiated';
    } else {
      // Only transition to terminal state if currently 'in_progress' or 'initiated'
      // Prevents overwriting already-completed calls
      conditionExpression = '#status IN (:initiated, :in_progress)';
      expressionAttributeValues[':initiated'] = 'initiated';
      expressionAttributeValues[':in_progress'] = 'in_progress';
    }

    await db.send(
      new UpdateCommand({
        TableName: process.env.CALLS_TABLE_NAME || 'calls',
        Key: {
          user_id: userId,
          call_id: callId,
        },
        UpdateExpression: updateExpression,
        ConditionExpression: conditionExpression,
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
    console.log(`✅ Call ${callId} status updated to ${status}`);
  } catch (error: any) {
    // Handle conditional check failure gracefully
    if (error.name === 'ConditionalCheckFailedException') {
      console.warn(
        `⚠️  [RACE CONDITION] Cannot update call ${callId} to ${status} - ` +
        `current status does not allow this transition (likely already completed by another process)`
      );
      // This is expected behavior - don't throw, just log
    } else {
      console.error(`❌ Error updating call status for ${callId}:`, error);
      // Re-throw for unexpected errors
      throw error;
    }
  }
}

/**
 * Send bot assignment to SQS queue for warm pool processing
 * This replaces ECS RunTask for instant bot assignment
 */
export async function sendBotAssignment(
  sqsClient: SQSClient,
  queueUrl: string,
  assignment: {
    callId: string;
    userId: string;
    agentId: string;
    roomUrl: string;
    roomName: string;
    botToken: string;
    agentInfo: AgentInfo;
    memoryContext?: string;
    remainingMinutes?: number;
    userGoogleApiKey?: string;
  }
): Promise<{ success: boolean; messageId?: string }> {
  const startTime = Date.now();

  try {
    console.log(`[sendBotAssignment] Sending assignment for call ${assignment.callId} to warm pool`);

    // Send assignment message to queue
    const result = await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          callId: assignment.callId,
          userId: assignment.userId,
          agentId: assignment.agentId,
          roomUrl: assignment.roomUrl,
          roomName: assignment.roomName,
          botToken: assignment.botToken,
          agentInfo: {
            name: assignment.agentInfo.name,
            type: assignment.agentInfo.agent_type,
            voiceId: assignment.agentInfo.voice_id,
            voiceEmotion: assignment.agentInfo.voice_emotion,
            callPrompt: assignment.agentInfo.call_prompt,
          },
          memoryContext: assignment.memoryContext || '',
          remainingMinutes: assignment.remainingMinutes || 10,
          userGoogleApiKey: assignment.userGoogleApiKey || '',
          timestamp: new Date().toISOString(),
        }),
        MessageAttributes: {
          'Priority': {
            DataType: 'Number',
            StringValue: '1', // High priority for user-initiated calls
          },
          'AgentId': {
            DataType: 'String',
            StringValue: assignment.agentId,
          },
          'UserId': {
            DataType: 'String',
            StringValue: assignment.userId,
          },
        },
      })
    );

    // Track successful assignment queuing
    const latency = Date.now() - startTime;
    await publishMetric(
      MetricName.BOT_ASSIGNMENT_QUEUED,
      1,
      StandardUnit.Count,
      {
        AgentId: assignment.agentId,
        UserId: assignment.userId,
      }
    );

    await publishMetric(
      MetricName.BOT_ASSIGNMENT_LATENCY,
      latency,
      StandardUnit.Milliseconds,
      {
        AgentId: assignment.agentId,
      }
    );

    console.log(
      `[sendBotAssignment] ✅ Assignment queued successfully in ${latency}ms (MessageId: ${result.MessageId})`
    );

    return {
      success: true,
      messageId: result.MessageId,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`[sendBotAssignment] ❌ Failed to queue assignment after ${latency}ms:`, error);

    // Track failure metric
    await publishMetric(
      MetricName.BOT_ASSIGNMENT_FAILED,
      1,
      StandardUnit.Count,
      {
        AgentId: assignment.agentId,
        ErrorType: error instanceof Error ? error.constructor.name : 'UnknownError',
      }
    );

    throw error;
  }
}
