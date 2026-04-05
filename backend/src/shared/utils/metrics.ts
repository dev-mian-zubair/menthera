/**
 * CloudWatch Metrics utility for tracking call service performance
 * Publishes custom metrics to enable monitoring and alerting
 */

import { CloudWatchClient, PutMetricDataCommand, MetricDatum, StandardUnit } from '@aws-sdk/client-cloudwatch';

// Singleton CloudWatch client
let cloudWatchClient: CloudWatchClient | null = null;

function getCloudWatchClient(): CloudWatchClient {
  if (!cloudWatchClient) {
    cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });
  }
  return cloudWatchClient;
}

// Namespace for all call service metrics
const NAMESPACE = 'Menthera/CallService';

/**
 * Metric names enum for type safety
 */
export enum MetricName {
  // Call Initiation Metrics
  CALL_INITIATED = 'CallInitiated',
  CALL_SUCCESS = 'CallSuccess',
  CALL_FAILURE = 'CallFailure',
  CALL_QUOTA_EXCEEDED = 'CallQuotaExceeded',

  // Call Duration Metrics
  CALL_DURATION = 'CallDuration',

  // ECS Task Metrics
  ECS_TASK_STARTED = 'EcsTaskStarted',
  ECS_TASK_FAILED = 'EcsTaskFailed',
  ECS_TASK_STOP_FAILED = 'EcsTaskStopFailed',
  ECS_TASK_COUNT = 'EcsTaskCount',

  // ⚡ Warm Pool / Bot Assignment Metrics
  BOT_ASSIGNMENT_QUEUED = 'BotAssignmentSent', // Using "Sent" for CloudWatch alarm compatibility
  BOT_ASSIGNMENT_FAILED = 'BotAssignmentFailed',
  BOT_ASSIGNMENT_LATENCY = 'BotAssignmentLatency',

  // User Behavior Metrics
  CALL_USER_LEFT_EARLY = 'CallUserLeftEarly',
  CALL_SUPERSEDED = 'CallSuperseded',

  // Daily.co API Metrics
  DAILY_ROOM_CREATED = 'DailyRoomCreated',
  DAILY_ROOM_REUSED = 'DailyRoomReused',
  DAILY_TOKEN_CREATED = 'DailyTokenCreated',
  DAILY_API_LATENCY = 'DailyApiLatency',

  // Circuit Breaker Metrics
  CIRCUIT_BREAKER_OPEN = 'CircuitBreakerOpen',
  CIRCUIT_BREAKER_HALF_OPEN = 'CircuitBreakerHalfOpen',
  CIRCUIT_BREAKER_CLOSED = 'CircuitBreakerClosed',

  // Error Metrics
  LAMBDA_ERROR = 'LambdaError',
  VALIDATION_ERROR = 'ValidationError',
  TIMEOUT_ERROR = 'TimeoutError',

  // Cache Metrics
  CACHE_HIT = 'CacheHit',
  CACHE_MISS = 'CacheMiss',

  // Retry Metrics
  RETRY_ATTEMPT = 'RetryAttempt',
  RETRY_SUCCESS = 'RetrySuccess',
  RETRY_EXHAUSTED = 'RetryExhausted',
}

/**
 * Dimension for organizing metrics
 */
interface MetricDimensions {
  Environment?: string;
  AgentId?: string;
  UserId?: string;
  ErrorType?: string;
  Service?: string;
  [key: string]: string | undefined;
}

/**
 * Publish a single metric to CloudWatch
 */
export async function publishMetric(
  metricName: MetricName,
  value: number,
  unit: StandardUnit = StandardUnit.Count,
  dimensions: MetricDimensions = {}
): Promise<void> {
  try {
    const client = getCloudWatchClient();

    // Always include environment dimension
    const allDimensions = {
      Environment: process.env.ENVIRONMENT || 'dev',
      ...dimensions,
    };

    // Convert dimensions to CloudWatch format
    const metricDimensions = Object.entries(allDimensions)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => ({
        Name: key,
        Value: value as string,
      }));

    const metricDatum: MetricDatum = {
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: metricDimensions.length > 0 ? metricDimensions : undefined,
    };

    await client.send(
      new PutMetricDataCommand({
        Namespace: NAMESPACE,
        MetricData: [metricDatum],
      })
    );

    console.log(`[Metrics] Published: ${metricName}=${value} ${unit}`, dimensions);
  } catch (error) {
    // Don't fail the request if metrics fail
    console.error(`[Metrics] Failed to publish ${metricName}:`, error);
  }
}

/**
 * Publish multiple metrics in a single API call (more efficient)
 */
export async function publishMetrics(
  metrics: Array<{
    name: MetricName;
    value: number;
    unit?: StandardUnit;
    dimensions?: MetricDimensions;
  }>
): Promise<void> {
  try {
    const client = getCloudWatchClient();

    const metricData: MetricDatum[] = metrics.map(({ name, value, unit, dimensions }) => {
      const allDimensions = {
        Environment: process.env.ENVIRONMENT || 'dev',
        ...dimensions,
      };

      const metricDimensions = Object.entries(allDimensions)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => ({
          Name: key,
          Value: value as string,
        }));

      return {
        MetricName: name,
        Value: value,
        Unit: unit || StandardUnit.Count,
        Timestamp: new Date(),
        Dimensions: metricDimensions.length > 0 ? metricDimensions : undefined,
      };
    });

    await client.send(
      new PutMetricDataCommand({
        Namespace: NAMESPACE,
        MetricData: metricData,
      })
    );

    console.log(`[Metrics] Published ${metrics.length} metrics`);
  } catch (error) {
    console.error('[Metrics] Failed to publish metrics:', error);
  }
}

/**
 * Track call initiation
 */
export async function trackCallInitiated(agentId: string, userId: string): Promise<void> {
  await publishMetric(MetricName.CALL_INITIATED, 1, StandardUnit.Count, {
    AgentId: agentId,
    UserId: userId,
  });
}

/**
 * Track successful call
 */
export async function trackCallSuccess(agentId: string, userId: string, durationSeconds: number): Promise<void> {
  await publishMetrics([
    {
      name: MetricName.CALL_SUCCESS,
      value: 1,
      unit: StandardUnit.Count,
      dimensions: { AgentId: agentId, UserId: userId },
    },
    {
      name: MetricName.CALL_DURATION,
      value: durationSeconds,
      unit: StandardUnit.Seconds,
      dimensions: { AgentId: agentId },
    },
  ]);
}

/**
 * Track failed call
 */
export async function trackCallFailure(agentId: string, userId: string, errorType: string): Promise<void> {
  await publishMetric(MetricName.CALL_FAILURE, 1, StandardUnit.Count, {
    AgentId: agentId,
    UserId: userId,
    ErrorType: errorType,
  });
}

/**
 * Track ECS task started
 */
export async function trackEcsTaskStarted(agentId: string): Promise<void> {
  await publishMetric(MetricName.ECS_TASK_STARTED, 1, StandardUnit.Count, {
    AgentId: agentId,
  });
}

/**
 * Track ECS task failed
 */
export async function trackEcsTaskFailed(agentId: string, errorType: string): Promise<void> {
  await publishMetric(MetricName.ECS_TASK_FAILED, 1, StandardUnit.Count, {
    AgentId: agentId,
    ErrorType: errorType,
  });
}

/**
 * Track ECS task count
 */
export async function trackEcsTaskCount(count: number): Promise<void> {
  await publishMetric(MetricName.ECS_TASK_COUNT, count, StandardUnit.Count);
}

/**
 * Track Daily.co API latency
 */
export async function trackDailyApiLatency(operation: string, latencyMs: number): Promise<void> {
  await publishMetric(MetricName.DAILY_API_LATENCY, latencyMs, StandardUnit.Milliseconds, {
    Service: operation,
  });
}

/**
 * Track cache hit/miss
 */
export async function trackCacheHit(cacheKey: string): Promise<void> {
  await publishMetric(MetricName.CACHE_HIT, 1, StandardUnit.Count, {
    Service: cacheKey,
  });
}

export async function trackCacheMiss(cacheKey: string): Promise<void> {
  await publishMetric(MetricName.CACHE_MISS, 1, StandardUnit.Count, {
    Service: cacheKey,
  });
}

/**
 * Track circuit breaker state change
 */
export async function trackCircuitBreakerState(circuitName: string, state: 'OPEN' | 'HALF_OPEN' | 'CLOSED'): Promise<void> {
  const metricName = state === 'OPEN'
    ? MetricName.CIRCUIT_BREAKER_OPEN
    : state === 'HALF_OPEN'
    ? MetricName.CIRCUIT_BREAKER_HALF_OPEN
    : MetricName.CIRCUIT_BREAKER_CLOSED;

  await publishMetric(metricName, 1, StandardUnit.Count, {
    Service: circuitName,
  });
}
