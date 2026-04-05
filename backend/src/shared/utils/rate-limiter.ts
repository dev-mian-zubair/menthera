/**
 * Distributed Rate Limiter using DynamoDB
 * Prevents abuse by limiting requests per user/IP
 */

import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  RATE_LIMIT_PRESETS,
  RATE_LIMIT_DDB_CONFIG,
  calculateRateLimitTtl,
} from '../config/rate-limits.config';

export interface RateLimitConfig {
  maxRequests: number; // Max requests allowed
  windowMs: number; // Time window in milliseconds
  keyPrefix: string; // Prefix for the rate limit key (e.g., 'call-create')
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Timestamp when the limit resets
  retryAfter?: number; // Seconds to wait before retrying (if blocked)
}

/**
 * Default rate limit configurations
 * Re-exported from centralized config for backward compatibility
 */
export const RateLimitPresets = RATE_LIMIT_PRESETS;

/**
 * DynamoDB-based distributed rate limiter
 */
export class RateLimiter {
  private db: DynamoDBDocumentClient;
  private tableName: string;

  constructor(db: DynamoDBDocumentClient, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  /**
   * Check if a request is allowed and atomically update the counter.
   * Uses a single UpdateCommand with ConditionExpression to prevent race conditions.
   */
  async checkLimit(
    userId: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const rateLimitKey = `${config.keyPrefix}:${userId}`;
    const windowStart = now - config.windowMs;
    const resetAt = now + config.windowMs;

    try {
      // Atomic increment with condition check:
      // - If record doesn't exist or window expired: reset counter to 1
      // - If within window and under limit: increment
      // - If at/over limit: ConditionCheckFailed
      const result = await this.db.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { rate_limit_key: rateLimitKey },
          UpdateExpression: `
            SET request_count = if_not_exists(request_count, :zero) + :inc,
                window_start = if_not_exists(window_start, :now),
                reset_at = if_not_exists(reset_at, :resetAt),
                ttl = :ttl
          `,
          ConditionExpression:
            'attribute_not_exists(request_count) OR window_start < :windowStart OR request_count < :max',
          ExpressionAttributeValues: {
            ':inc': 1,
            ':zero': 0,
            ':now': now,
            ':resetAt': resetAt,
            ':ttl': calculateRateLimitTtl(resetAt),
            ':windowStart': windowStart,
            ':max': config.maxRequests,
          },
          ReturnValues: 'ALL_NEW',
        })
      );

      const attrs = result.Attributes!;

      // If the window had expired, reset the record
      if (attrs.window_start < windowStart) {
        await this.db.send(
          new PutCommand({
            TableName: this.tableName,
            Item: {
              rate_limit_key: rateLimitKey,
              request_count: 1,
              window_start: now,
              reset_at: resetAt,
              ttl: calculateRateLimitTtl(resetAt),
            },
          })
        );

        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetAt,
        };
      }

      const newCount = attrs.request_count || 0;

      return {
        allowed: true,
        remaining: Math.max(0, config.maxRequests - newCount),
        resetAt: attrs.reset_at,
      };
    } catch (error: any) {
      // ConditionalCheckFailedException means rate limit exceeded
      if (error.name === 'ConditionalCheckFailedException') {
        // Fetch current state to return accurate rate limit info
        try {
          const current = await this.db.send(
            new GetCommand({
              TableName: this.tableName,
              Key: { rate_limit_key: rateLimitKey },
            })
          );
          const item = current.Item;
          const retryAfter = item ? Math.ceil((item.reset_at - now) / 1000) : 1;

          return {
            allowed: false,
            remaining: 0,
            resetAt: item?.reset_at || resetAt,
            retryAfter: retryAfter > 0 ? retryAfter : 1,
          };
        } catch {
          return {
            allowed: false,
            remaining: 0,
            resetAt,
            retryAfter: Math.ceil(config.windowMs / 1000),
          };
        }
      }

      console.error('[RateLimiter] Error checking rate limit:', error);

      // Fail open to prevent blocking legitimate users
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    userId: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const rateLimitKey = `${config.keyPrefix}:${userId}`;

    try {
      const result = await this.db.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { rate_limit_key: rateLimitKey },
        })
      );

      const item = result.Item;
      const windowStart = now - config.windowMs;

      if (!item || item.window_start < windowStart) {
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetAt: now + config.windowMs,
        };
      }

      const isAllowed = item.request_count < config.maxRequests;
      const retryAfter = isAllowed ? undefined : Math.ceil((item.reset_at - now) / 1000);

      return {
        allowed: isAllowed,
        remaining: Math.max(0, config.maxRequests - item.request_count),
        resetAt: item.reset_at,
        retryAfter,
      };
    } catch (error) {
      console.error('[RateLimiter] Error getting rate limit status:', error);

      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: now + config.windowMs,
      };
    }
  }

  /**
   * Reset rate limit for a user (admin function)
   */
  async resetLimit(userId: string, config: RateLimitConfig): Promise<void> {
    const rateLimitKey = `${config.keyPrefix}:${userId}`;

    await this.db.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          rate_limit_key: rateLimitKey,
          request_count: 0,
          window_start: Date.now(),
          reset_at: Date.now() + config.windowMs,
          ttl: calculateRateLimitTtl(Date.now() + config.windowMs),
        },
      })
    );
  }
}

/**
 * Helper function to format rate limit headers for HTTP responses
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 1 : 0)),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
    ...(result.retryAfter && { 'Retry-After': String(result.retryAfter) }),
  };
}
