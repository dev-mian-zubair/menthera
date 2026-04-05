import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ECSClient, StopTaskCommand } from '@aws-sdk/client-ecs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ClerkLambdaAuth } from '../../shared/utils/clerk-lambda-auth';
import { MetricName, publishMetric } from '../../shared/utils/metrics';
import { StandardUnit } from '@aws-sdk/client-cloudwatch';
import { GRACEFUL_SHUTDOWN_CONFIG } from '../../shared/config/timeouts.config';
import { CORS_ALLOWED_ORIGIN } from '../../shared/utils/response-builder';

/**
 * Handler for POST /call/{callId}/user-left
 * Called when user leaves call (navigates away, backgrounds app, etc.)
 * Immediately stops ECS task to prevent quota waste
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

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

    // Verify authentication
    let userId: string;
    try {
      const authHeader = event.headers.Authorization || event.headers.authorization;
      const authContext = await ClerkLambdaAuth.verifyToken(authHeader);
      userId = authContext.userId;
    } catch (authError) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Unauthorized' }),
      };
    }

    // Extract callId from path parameters
    const callId = event.pathParameters?.callId;
    if (!callId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Call ID is required' }),
      };
    }

    console.log(`[UserLeftHandler] User ${userId} left call ${callId}`);

    // Initialize clients
    const dbClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: process.env.AWS_REGION })
    );
    const ecsClient = new ECSClient({ region: process.env.AWS_REGION });

    // Get call details from DynamoDB
    const callResponse = await dbClient.send(
      new GetCommand({
        TableName: process.env.CALLS_TABLE_NAME,
        Key: { user_id: userId, call_id: callId },
      })
    );

    if (!callResponse.Item) {
      console.warn(`[UserLeftHandler] Call ${callId} not found for user ${userId}`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'Call not found' }),
      };
    }

    const call = callResponse.Item;

    // Check if call is already ended
    if (call.status === 'ended' || call.status === 'completed') {
      console.log(`[UserLeftHandler] Call ${callId} already ended (status: ${call.status})`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Call already ended',
          alreadyEnded: true,
        }),
      };
    }

    // Track metric for user-initiated early termination
    await publishMetric(
      MetricName.CALL_USER_LEFT_EARLY,
      1,
      StandardUnit.Count,
      {
        UserId: userId,
        AgentId: call.agent_id,
        CallId: callId,
      }
    );

    // Step 1: Signal graceful shutdown by setting status to 'ending'
    // This tells Pipecat to finish up and send transcript
    const now = new Date().toISOString();
    console.log(`[UserLeftHandler] Setting call ${callId} status to 'ending' for graceful shutdown`);

    await dbClient.send(
      new UpdateCommand({
        TableName: process.env.CALLS_TABLE_NAME,
        Key: { user_id: userId, call_id: callId },
        UpdateExpression: 'SET #status = :status, user_left_at = :userLeftAt, updated_at = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'ending',
          ':userLeftAt': now,
          ':updatedAt': now,
        },
      })
    );

    // Step 2: Wait for Pipecat to gracefully shutdown
    // Pipecat monitors DynamoDB and will detect 'ending' status
    const { timeoutMs: maxWaitTime, checkIntervalMs: checkInterval } = GRACEFUL_SHUTDOWN_CONFIG;
    console.log(`[UserLeftHandler] Waiting ${maxWaitTime / 1000}s for Pipecat to complete graceful shutdown...`);

    let gracefulShutdownComplete = false;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));

      // Check if call status has been updated to 'completed' by Pipecat
      const checkResponse = await dbClient.send(
        new GetCommand({
          TableName: process.env.CALLS_TABLE_NAME,
          Key: { user_id: userId, call_id: callId },
        })
      );

      if (checkResponse.Item?.status === 'completed') {
        gracefulShutdownComplete = true;
        console.log(`[UserLeftHandler] ✓ Pipecat completed graceful shutdown`);
        break;
      }
    }

    // Step 3: Force stop ECS task if graceful shutdown didn't complete
    if (!gracefulShutdownComplete && call.task_arn) {
      console.warn(`[UserLeftHandler] ⚠️  Graceful shutdown timeout - force stopping ECS task`);

      try {
        await ecsClient.send(
          new StopTaskCommand({
            cluster: process.env.ECS_CLUSTER_NAME || 'menthera-voice-cluster',
            task: call.task_arn,
            reason: 'User left call - graceful shutdown timeout',
          })
        );

        console.log(`[UserLeftHandler] ✓ ECS task force-stopped after timeout`);

        // Update status to 'ended' since Pipecat didn't finish
        await dbClient.send(
          new UpdateCommand({
            TableName: process.env.CALLS_TABLE_NAME,
            Key: { user_id: userId, call_id: callId },
            UpdateExpression: 'SET #status = :status, ended_at = :endedAt, updated_at = :updatedAt',
            ExpressionAttributeNames: {
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':status': 'ended',
              ':endedAt': now,
              ':updatedAt': now,
            },
          })
        );
      } catch (ecsError) {
        console.warn(`[UserLeftHandler] Error force-stopping ECS task:`, ecsError);

        if (ecsError instanceof Error && ecsError.message.includes('not found')) {
          console.log(`[UserLeftHandler] Task already stopped`);
        } else {
          await publishMetric(
            MetricName.ECS_TASK_STOP_FAILED,
            1,
            StandardUnit.Count,
            {
              UserId: userId,
              AgentId: call.agent_id,
              ErrorType: ecsError instanceof Error ? ecsError.name : 'Unknown',
            }
          );
        }
      }
    }

    console.log(`[UserLeftHandler] ✓ Call ${callId} marked as ended`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Call ended successfully',
        callId,
        taskStopped: !!call.task_arn,
      }),
    };
  } catch (error) {
    console.error('[UserLeftHandler] Unexpected error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    };
  }
};
