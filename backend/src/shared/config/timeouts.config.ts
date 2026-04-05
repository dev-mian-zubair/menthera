/**
 * Timeout and Retry Configuration
 *
 * Centralized configuration for all timeout, retry, circuit breaker,
 * and graceful shutdown settings across the application.
 */

/**
 * Retry configuration for external API calls
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  maxAttempts: 3,
  /** Initial delay between retries in milliseconds */
  initialDelayMs: 1000,
  /** Maximum delay between retries in milliseconds */
  maxDelayMs: 10000,
  /** Multiplier for exponential backoff */
  backoffMultiplier: 2,
  /** Error codes/messages that should trigger a retry */
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'EAI_AGAIN',
    'fetch failed',
    'NetworkError',
    'TimeoutError',
    'rate limit',
    'too many requests',
    '429',
    '500',
    '502',
    '503',
    '504',
  ],
} as const;

/**
 * Retry configuration for Daily.co API calls (more aggressive)
 */
export const DAILY_API_RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
} as const;

/**
 * Circuit breaker configuration
 */
export const CIRCUIT_BREAKER_CONFIG = {
  /** Number of failures before opening circuit */
  failureThreshold: 5,
  /** Number of successes to close circuit from half-open */
  successThreshold: 2,
  /** Time in ms to wait before trying again (open -> half-open) */
  timeoutMs: 60000,
  /** Time window in ms to track failures */
  monitoringPeriodMs: 120000,
} as const;

/**
 * Circuit breaker configuration for ECS tasks (stricter)
 */
export const ECS_CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3,
  successThreshold: 2,
  timeoutMs: 60000,
  monitoringPeriodMs: 120000,
} as const;

/**
 * Cache TTL configuration
 */
export const CACHE_CONFIG = {
  /** Secrets cache TTL in milliseconds (5 minutes) */
  secretsTtlMs: 5 * 60 * 1000,
  /** Agent cache TTL in milliseconds (5 minutes) */
  agentCacheTtlMs: 5 * 60 * 1000,
} as const;

/**
 * Graceful shutdown configuration
 */
export const GRACEFUL_SHUTDOWN_CONFIG = {
  /** Maximum time to wait for graceful shutdown in milliseconds */
  timeoutMs: 15000,
  /** Interval to check for shutdown completion in milliseconds */
  checkIntervalMs: 1000,
} as const;

/**
 * Call duration configuration
 */
export const CALL_DURATION_CONFIG = {
  /** Maximum call duration in seconds (30 minutes) */
  maxDurationSeconds: 30 * 60,
  /** User idle timeout in seconds */
  userIdleTimeoutSeconds: 10,
} as const;

/**
 * Environment variable names for overriding timeouts
 */
export const TIMEOUT_ENV_VARS = {
  maxCallDuration: 'MAX_CALL_DURATION_SECONDS',
  userIdleTimeout: 'USER_IDLE_TIMEOUT_SECONDS',
  secretsCacheTtl: 'SECRETS_CACHE_TTL_MS',
  gracefulShutdownTimeout: 'GRACEFUL_SHUTDOWN_TIMEOUT_MS',
} as const;

/**
 * Get retry config with optional environment variable overrides
 */
export function getRetryConfig() {
  return {
    maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || '', 10) || RETRY_CONFIG.maxAttempts,
    initialDelayMs: parseInt(process.env.RETRY_INITIAL_DELAY_MS || '', 10) || RETRY_CONFIG.initialDelayMs,
    maxDelayMs: parseInt(process.env.RETRY_MAX_DELAY_MS || '', 10) || RETRY_CONFIG.maxDelayMs,
    backoffMultiplier: parseFloat(process.env.RETRY_BACKOFF_MULTIPLIER || '') || RETRY_CONFIG.backoffMultiplier,
    retryableErrors: RETRY_CONFIG.retryableErrors,
  };
}

/**
 * Get circuit breaker config with optional environment variable overrides
 */
export function getCircuitBreakerConfig() {
  return {
    failureThreshold: parseInt(process.env.CB_FAILURE_THRESHOLD || '', 10) || CIRCUIT_BREAKER_CONFIG.failureThreshold,
    successThreshold: parseInt(process.env.CB_SUCCESS_THRESHOLD || '', 10) || CIRCUIT_BREAKER_CONFIG.successThreshold,
    timeout: parseInt(process.env.CB_TIMEOUT_MS || '', 10) || CIRCUIT_BREAKER_CONFIG.timeoutMs,
    monitoringPeriod: parseInt(process.env.CB_MONITORING_PERIOD_MS || '', 10) || CIRCUIT_BREAKER_CONFIG.monitoringPeriodMs,
  };
}

/**
 * Get graceful shutdown config with optional environment variable overrides
 */
export function getGracefulShutdownConfig() {
  return {
    timeoutMs: parseInt(process.env[TIMEOUT_ENV_VARS.gracefulShutdownTimeout] || '', 10) || GRACEFUL_SHUTDOWN_CONFIG.timeoutMs,
    checkIntervalMs: GRACEFUL_SHUTDOWN_CONFIG.checkIntervalMs,
  };
}

/**
 * Get cache config with optional environment variable overrides
 */
export function getCacheConfig() {
  return {
    secretsTtlMs: parseInt(process.env[TIMEOUT_ENV_VARS.secretsCacheTtl] || '', 10) || CACHE_CONFIG.secretsTtlMs,
    agentCacheTtlMs: CACHE_CONFIG.agentCacheTtlMs,
  };
}
