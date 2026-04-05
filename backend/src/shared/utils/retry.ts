/**
 * Retry utility for external API calls with exponential backoff
 */

import { RETRY_CONFIG } from '../config/timeouts.config';

export interface RetryOptions {
  maxAttempts?: number; // Maximum number of retry attempts (default: 3)
  initialDelayMs?: number; // Initial delay between retries in milliseconds (default: 1000)
  maxDelayMs?: number; // Maximum delay between retries (default: 10000)
  backoffMultiplier?: number; // Multiplier for exponential backoff (default: 2)
  retryableErrors?: string[]; // List of error messages/codes that should trigger a retry
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: RETRY_CONFIG.maxAttempts,
  initialDelayMs: RETRY_CONFIG.initialDelayMs,
  maxDelayMs: RETRY_CONFIG.maxDelayMs,
  backoffMultiplier: RETRY_CONFIG.backoffMultiplier,
  retryableErrors: [...RETRY_CONFIG.retryableErrors],
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable based on the error message/code
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  const errorString = error?.message || error?.code || String(error);
  return retryableErrors.some((retryable) =>
    errorString.toLowerCase().includes(retryable.toLowerCase())
  );
}

/**
 * Retry a function with exponential backoff
 *
 * @example
 * const result = await retryWithBackoff(
 *   async () => await fetch('https://api.example.com'),
 *   { maxAttempts: 3, initialDelayMs: 1000 }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let currentDelay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      console.log(`[Retry] Attempt ${attempt}/${opts.maxAttempts}`);
      const result = await fn();
      if (attempt > 1) {
        console.log(`[Retry] ✓ Succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;

      // Check if this is the last attempt
      if (attempt === opts.maxAttempts) {
        console.error(`[Retry] ✗ All ${opts.maxAttempts} attempts failed`);
        break;
      }

      // Check if the error is retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        console.error('[Retry] ✗ Error is not retryable, aborting:', error);
        throw error;
      }

      console.warn(
        `[Retry] ⚠️ Attempt ${attempt} failed, retrying in ${currentDelay}ms...`,
        error instanceof Error ? error.message : error
      );

      // Wait before next retry
      await sleep(currentDelay);

      // Calculate next delay with exponential backoff
      currentDelay = Math.min(
        currentDelay * opts.backoffMultiplier,
        opts.maxDelayMs
      );
    }
  }

  // All attempts failed
  throw lastError;
}

/**
 * Retry a function with a fixed delay between attempts (no exponential backoff)
 */
export async function retryWithFixedDelay<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts,
    initialDelayMs: delayMs,
    backoffMultiplier: 1, // No exponential backoff
  });
}
