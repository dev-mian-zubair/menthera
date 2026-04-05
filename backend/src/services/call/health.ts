/**
 * Health Check Endpoint for Call Service
 * Returns health status of the service and its dependencies
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ECSClient, DescribeClustersCommand } from '@aws-sdk/client-ecs';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { CORS_ALLOWED_ORIGIN } from '../../shared/utils/response-builder';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  service: string;
  checks: {
    dynamodb: HealthCheckResult;
    ecs: HealthCheckResult;
    sqs: HealthCheckResult;
  };
}

interface HealthCheckResult {
  status: 'pass' | 'fail';
  responseTime?: number;
  message?: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const startTime = Date.now();

  // Run health checks in parallel
  const [dynamoCheck, ecsCheck, sqsCheck] = await Promise.allSettled([
    checkDynamoDB(),
    checkECS(),
    checkSQS(),
  ]);

  // Process results
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || '1.0.0',
    service: 'call-service',
    checks: {
      dynamodb: getDynamoDBResult(dynamoCheck),
      ecs: getECSResult(ecsCheck),
      sqs: getSQSResult(sqsCheck),
    },
  };

  // Determine overall health status
  const failedChecks = Object.values(healthStatus.checks).filter(
    (check) => check.status === 'fail'
  );

  if (failedChecks.length === 0) {
    healthStatus.status = 'healthy';
  } else if (failedChecks.length === Object.keys(healthStatus.checks).length) {
    healthStatus.status = 'unhealthy';
  } else {
    healthStatus.status = 'degraded';
  }

  // Response status code based on health
  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

  const totalTime = Date.now() - startTime;
  console.log(`[Health] Check completed in ${totalTime}ms - Status: ${healthStatus.status}`);

  return {
    statusCode,
    headers,
    body: JSON.stringify(healthStatus, null, 2),
  };
};

/**
 * Check DynamoDB connectivity
 */
async function checkDynamoDB(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
    const db = DynamoDBDocumentClient.from(dbClient);

    const tableName = process.env.CALLS_TABLE_NAME;
    if (!tableName) {
      throw new Error('CALLS_TABLE_NAME environment variable not set');
    }

    // Attempt to get a non-existent item (lightweight operation)
    await db.send(
      new GetCommand({
        TableName: tableName,
        Key: { user_id: '__health_check__', call_id: '__health_check__' },
      })
    );

    const responseTime = Date.now() - startTime;

    return {
      status: 'pass',
      responseTime,
      message: `DynamoDB accessible (${responseTime}ms)`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'fail',
      responseTime,
      message: error instanceof Error ? error.message : 'DynamoDB check failed',
    };
  }
}

/**
 * Check ECS cluster status
 */
async function checkECS(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const ecsClient = new ECSClient({ region: process.env.AWS_REGION });
    const clusterArn = process.env.ECS_CLUSTER_ARN;

    if (!clusterArn) {
      throw new Error('ECS_CLUSTER_ARN environment variable not set');
    }

    const response = await ecsClient.send(
      new DescribeClustersCommand({
        clusters: [clusterArn],
      })
    );

    const cluster = response.clusters?.[0];
    if (!cluster) {
      throw new Error('Cluster not found');
    }

    const responseTime = Date.now() - startTime;

    return {
      status: 'pass',
      responseTime,
      message: `ECS cluster active (${cluster.runningTasksCount || 0} running tasks, ${responseTime}ms)`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'fail',
      responseTime,
      message: error instanceof Error ? error.message : 'ECS check failed',
    };
  }
}

/**
 * Check SQS queue status
 */
async function checkSQS(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

    // Check if queue URL is available (won't work in call handler, only in processor)
    // This is optional - service can be healthy without queue access
    const queueUrl = process.env.CALL_EVENTS_QUEUE_URL;
    if (!queueUrl) {
      return {
        status: 'pass',
        responseTime: 0,
        message: 'SQS not required for this service',
      };
    }

    const response = await sqsClient.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['ApproximateNumberOfMessages'],
      })
    );

    const responseTime = Date.now() - startTime;

    return {
      status: 'pass',
      responseTime,
      message: `SQS queue accessible (${responseTime}ms)`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'fail',
      responseTime,
      message: error instanceof Error ? error.message : 'SQS check failed',
    };
  }
}

/**
 * Extract result from settled promise
 */
function getDynamoDBResult(
  result: PromiseSettledResult<HealthCheckResult>
): HealthCheckResult {
  if (result.status === 'fulfilled') {
    return result.value;
  }
  return {
    status: 'fail',
    message: result.reason?.message || 'DynamoDB check failed',
  };
}

function getECSResult(
  result: PromiseSettledResult<HealthCheckResult>
): HealthCheckResult {
  if (result.status === 'fulfilled') {
    return result.value;
  }
  return {
    status: 'fail',
    message: result.reason?.message || 'ECS check failed',
  };
}

function getSQSResult(
  result: PromiseSettledResult<HealthCheckResult>
): HealthCheckResult {
  if (result.status === 'fulfilled') {
    return result.value;
  }
  return {
    status: 'fail',
    message: result.reason?.message || 'SQS check failed',
  };
}
