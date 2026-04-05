/**
 * Circuit Breaker Pattern implementation
 * Prevents cascading failures by temporarily blocking requests to failing services
 */

import { CIRCUIT_BREAKER_CONFIG } from '../config/timeouts.config';

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Blocking requests due to failures
  HALF_OPEN = 'HALF_OPEN', // Testing if service has recovered
}

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  successThreshold: number; // Number of successes to close circuit from half-open
  timeout: number; // Time in ms to wait before trying again (open -> half-open)
  monitoringPeriod: number; // Time window in ms to track failures
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: CIRCUIT_BREAKER_CONFIG.failureThreshold,
  successThreshold: CIRCUIT_BREAKER_CONFIG.successThreshold,
  timeout: CIRCUIT_BREAKER_CONFIG.timeoutMs,
  monitoringPeriod: CIRCUIT_BREAKER_CONFIG.monitoringPeriodMs,
};

// In-memory state (persists across warm Lambda invocations)
const circuitStates = new Map<string, CircuitBreakerState>();

/**
 * Get or initialize circuit breaker state
 */
function getCircuitState(name: string): CircuitBreakerState {
  if (!circuitStates.has(name)) {
    circuitStates.set(name, {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      nextAttemptTime: null,
    });
  }
  return circuitStates.get(name)!;
}

/**
 * Check if circuit should transition from OPEN to HALF_OPEN
 */
function checkTimeout(state: CircuitBreakerState, config: CircuitBreakerConfig): void {
  if (state.state === CircuitState.OPEN && state.nextAttemptTime) {
    const now = Date.now();
    if (now >= state.nextAttemptTime) {
      console.log('[CircuitBreaker] Transitioning to HALF_OPEN (timeout expired)');
      state.state = CircuitState.HALF_OPEN;
      state.successes = 0;
      state.failures = 0;
    }
  }
}

/**
 * Reset old failures outside monitoring period
 */
function resetOldFailures(state: CircuitBreakerState, config: CircuitBreakerConfig): void {
  if (state.lastFailureTime) {
    const now = Date.now();
    const timeSinceLastFailure = now - state.lastFailureTime;
    if (timeSinceLastFailure > config.monitoringPeriod) {
      console.log('[CircuitBreaker] Resetting old failures (outside monitoring period)');
      state.failures = 0;
      state.lastFailureTime = null;
    }
  }
}

/**
 * Execute a function with circuit breaker protection
 */
export async function executeWithCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  config: Partial<CircuitBreakerConfig> = {}
): Promise<T> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const state = getCircuitState(name);

  // Check if we should transition from OPEN to HALF_OPEN
  checkTimeout(state, fullConfig);

  // Reset old failures
  resetOldFailures(state, fullConfig);

  // Check circuit state
  if (state.state === CircuitState.OPEN) {
    const waitTime = state.nextAttemptTime ? Math.round((state.nextAttemptTime - Date.now()) / 1000) : 0;
    const errorMsg = `Circuit breaker is OPEN for "${name}". Service is temporarily unavailable. Try again in ${waitTime}s.`;
    console.error(`[CircuitBreaker] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    console.log(`[CircuitBreaker] Executing "${name}" (state: ${state.state})`);
    const result = await fn();

    // Success handling
    if (state.state === CircuitState.HALF_OPEN) {
      state.successes++;
      console.log(`[CircuitBreaker] Success in HALF_OPEN (${state.successes}/${fullConfig.successThreshold})`);

      if (state.successes >= fullConfig.successThreshold) {
        console.log('[CircuitBreaker] ✓ Transitioning to CLOSED (service recovered)');
        state.state = CircuitState.CLOSED;
        state.failures = 0;
        state.successes = 0;
        state.lastFailureTime = null;
        state.nextAttemptTime = null;
      }
    } else if (state.state === CircuitState.CLOSED) {
      // Reset failure count on success
      if (state.failures > 0) {
        console.log('[CircuitBreaker] Success in CLOSED, resetting failure count');
        state.failures = 0;
        state.lastFailureTime = null;
      }
    }

    return result;
  } catch (error) {
    // Failure handling
    state.failures++;
    state.lastFailureTime = Date.now();

    if (state.state === CircuitState.HALF_OPEN) {
      console.error(`[CircuitBreaker] ✗ Failure in HALF_OPEN, returning to OPEN`);
      state.state = CircuitState.OPEN;
      state.nextAttemptTime = Date.now() + fullConfig.timeout;
      state.successes = 0;
    } else if (state.state === CircuitState.CLOSED) {
      console.error(`[CircuitBreaker] ✗ Failure ${state.failures}/${fullConfig.failureThreshold}`);

      if (state.failures >= fullConfig.failureThreshold) {
        console.error('[CircuitBreaker] ⚠️ Transitioning to OPEN (failure threshold reached)');
        state.state = CircuitState.OPEN;
        state.nextAttemptTime = Date.now() + fullConfig.timeout;
      }
    }

    throw error;
  }
}

/**
 * Get circuit breaker status
 */
export function getCircuitStatus(name: string): {
  state: CircuitState;
  failures: number;
  successes: number;
  nextAttemptTime: number | null;
} {
  const state = getCircuitState(name);
  return {
    state: state.state,
    failures: state.failures,
    successes: state.successes,
    nextAttemptTime: state.nextAttemptTime,
  };
}

/**
 * Manually reset circuit breaker (useful for testing or forced recovery)
 */
export function resetCircuitBreaker(name: string): void {
  const state = getCircuitState(name);
  state.state = CircuitState.CLOSED;
  state.failures = 0;
  state.successes = 0;
  state.lastFailureTime = null;
  state.nextAttemptTime = null;
  console.log(`[CircuitBreaker] Manually reset circuit for "${name}"`);
}
