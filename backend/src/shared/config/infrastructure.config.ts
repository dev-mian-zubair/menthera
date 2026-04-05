/**
 * Infrastructure Configuration
 *
 * Centralized configuration for CDK infrastructure settings including
 * Lambda, ECS, SQS, and scaling configurations.
 *
 * Note: This file is imported by CDK stacks (not Lambda functions).
 * For runtime configuration, use environment variables.
 */

/**
 * Lambda function memory and timeout configurations
 */
export const LAMBDA_CONFIG = {
  /** Call processor - processes call transcripts and generates summaries */
  callProcessor: {
    memoryMiB: 1024,
    timeoutMinutes: 5,
  },
  /** Message handler - handles real-time chat conversations */
  messageHandler: {
    memoryMiB: 1024,
    timeoutSeconds: 60,
  },
  /** Quest handler - processes quest completions */
  questHandler: {
    memoryMiB: 1024,
    timeoutSeconds: 120,
  },
  /** Insights processor - generates insights from user sessions */
  insightsProcessor: {
    memoryMiB: 2048,
    timeoutSeconds: 300,
  },
  /** Create call - initiates voice calls */
  createCall: {
    memoryMiB: 256,
    timeoutMinutes: 2,
  },
  /** Health check - service health monitoring */
  healthCheck: {
    memoryMiB: 256,
    timeoutSeconds: 30,
  },
  /** User left handler - handles user leaving calls */
  userLeftHandler: {
    memoryMiB: 256,
    timeoutSeconds: 25,
  },
  /** Default settings for other Lambda functions */
  default: {
    memoryMiB: 512,
    timeoutSeconds: 30,
  },
} as const;

/**
 * ECS task and service configurations
 */
export const ECS_CONFIG = {
  /** Task definition settings */
  task: {
    memoryLimitMiB: 512,
    cpu: 256,
    containerMemoryMiB: 512,
  },
  /** Warm pool service settings by environment */
  warmPool: {
    production: {
      desiredCount: 3,
      minCapacity: 3,
      maxCapacity: 10,
    },
    development: {
      desiredCount: 2,
      minCapacity: 2,
      maxCapacity: 5,
    },
  },
  /** Health check settings */
  healthCheck: {
    gracePeriodSeconds: 60,
  },
} as const;

/**
 * SQS queue configurations
 */
export const SQS_CONFIG = {
  /** Call events queue */
  callEvents: {
    visibilityTimeoutMinutes: 5,
    maxReceiveCount: 3,
  },
  /** Bot assignments queue (warm pool) */
  botAssignments: {
    visibilityTimeoutMinutes: 10,
    receiveMessageWaitSeconds: 20,
    maxReceiveCount: 3,
    retentionHours: 1,
  },
  /** Insights processing queue */
  insights: {
    visibilityTimeoutSeconds: 300,
    receiveMessageWaitSeconds: 20,
    maxReceiveCount: 3,
  },
  /** Dead letter queue retention */
  dlqRetentionDays: 14,
} as const;

/**
 * Auto-scaling configurations
 */
export const SCALING_CONFIG = {
  /** Queue depth scaling steps for warm pool */
  queueDepthSteps: {
    noMessages: { upper: 0, change: 0 },
    fewMessages: { lower: 1, change: 1 },
    someMessages: { lower: 5, change: 2 },
    manyMessages: { lower: 10, change: 3 },
  },
  /** Cooldown periods */
  cooldownMinutes: 3,
  scaleDownCooldownMinutes: 10,
} as const;

/**
 * CORS configurations
 */
export const CORS_CONFIG = {
  /** Max age for CORS preflight cache (seconds) */
  maxAgeSeconds: 3600,
  /** Default allowed origins */
  allowedOrigins: ['*'],
  /** Default allowed headers */
  allowedHeaders: [
    'Content-Type',
    'X-Amz-Date',
    'Authorization',
    'X-Api-Key',
  ],
} as const;

/**
 * VPC configurations
 */
export const VPC_CONFIG = {
  /** Maximum availability zones */
  maxAzs: 2,
  /** NAT gateway configuration by environment */
  natGateways: {
    production: 1,
    development: 0,
  },
} as const;

/**
 * CloudWatch Logs configurations
 */
export const LOGS_CONFIG = {
  /** Log retention period */
  retentionDays: 30,
} as const;

/**
 * Helper function to get ECS warm pool config by environment
 */
export function getWarmPoolConfig(environment: string) {
  return environment === 'production'
    ? ECS_CONFIG.warmPool.production
    : ECS_CONFIG.warmPool.development;
}

/**
 * Helper function to get NAT gateway count by environment
 */
export function getNatGatewayCount(environment: string): number {
  return environment === 'production'
    ? VPC_CONFIG.natGateways.production
    : VPC_CONFIG.natGateways.development;
}
