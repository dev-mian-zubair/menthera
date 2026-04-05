/**
 * Rate Limiting Configuration
 *
 * Centralized configuration for all rate limiting settings.
 * These limits prevent API abuse and ensure fair usage.
 */

export interface RateLimitPreset {
  /** Maximum requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key prefix for rate limit storage */
  keyPrefix: string;
}

/**
 * Rate limit presets for different operations
 */
export const RATE_LIMIT_PRESETS = {
  /** Standard call creation limit: 10 calls per hour */
  CALL_CREATE: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'call-create',
  } as RateLimitPreset,

  /** Strict limit for abuse prevention: 3 calls per 5 minutes */
  CALL_CREATE_STRICT: {
    maxRequests: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    keyPrefix: 'call-create-strict',
  } as RateLimitPreset,

  /** Generous limit for power users: 50 calls per day */
  CALL_CREATE_GENEROUS: {
    maxRequests: 50,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    keyPrefix: 'call-create-daily',
  } as RateLimitPreset,

  /** Message sending limit: 100 messages per hour */
  MESSAGE_SEND: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'message-send',
  } as RateLimitPreset,

  /** API general limit: 1000 requests per hour */
  API_GENERAL: {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'api-general',
  } as RateLimitPreset,
} as const;

/**
 * DynamoDB TTL configuration for rate limit records
 */
export const RATE_LIMIT_DDB_CONFIG = {
  /** Additional TTL offset in seconds (24 hours after reset) */
  ttlOffsetSeconds: 86400,
} as const;

/**
 * Environment variable names for rate limit overrides
 */
export const RATE_LIMIT_ENV_VARS = {
  callCreateMax: 'RATE_LIMIT_CALL_CREATE_MAX',
  callCreateWindowMs: 'RATE_LIMIT_CALL_CREATE_WINDOW_MS',
  messageMax: 'RATE_LIMIT_MESSAGE_MAX',
  messageWindowMs: 'RATE_LIMIT_MESSAGE_WINDOW_MS',
} as const;

/**
 * Get rate limit preset with optional environment variable overrides
 */
export function getRateLimitPreset(preset: keyof typeof RATE_LIMIT_PRESETS): RateLimitPreset {
  const basePreset = RATE_LIMIT_PRESETS[preset];

  if (preset === 'CALL_CREATE') {
    return {
      maxRequests: parseInt(process.env[RATE_LIMIT_ENV_VARS.callCreateMax] || '', 10) || basePreset.maxRequests,
      windowMs: parseInt(process.env[RATE_LIMIT_ENV_VARS.callCreateWindowMs] || '', 10) || basePreset.windowMs,
      keyPrefix: basePreset.keyPrefix,
    };
  }

  if (preset === 'MESSAGE_SEND') {
    return {
      maxRequests: parseInt(process.env[RATE_LIMIT_ENV_VARS.messageMax] || '', 10) || basePreset.maxRequests,
      windowMs: parseInt(process.env[RATE_LIMIT_ENV_VARS.messageWindowMs] || '', 10) || basePreset.windowMs,
      keyPrefix: basePreset.keyPrefix,
    };
  }

  return basePreset;
}

/**
 * Calculate TTL for rate limit DynamoDB records
 */
export function calculateRateLimitTtl(resetAt: number): number {
  return Math.floor(resetAt / 1000) + RATE_LIMIT_DDB_CONFIG.ttlOffsetSeconds;
}
