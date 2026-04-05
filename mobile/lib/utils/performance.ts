/**
 * Performance Monitoring Utility
 * Tracks chat performance metrics and logs them
 */
import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

const metrics: PerformanceMetric[] = [];
const MAX_STORED_METRICS = 100;

/**
 * Start tracking a performance metric
 */
export function startTimer(name: string) {
  const startTime = Date.now();
  return {
    end: (metadata?: Record<string, any>) => {
      const duration = Date.now() - startTime;
      recordMetric(name, duration, metadata);
    },
    start: startTime,
  };
}

/**
 * Record a performance metric
 */
export function recordMetric(
  name: string,
  duration: number,
  metadata?: Record<string, any>
) {
  const metric: PerformanceMetric = {
    name,
    duration,
    timestamp: Date.now(),
    metadata,
  };

  metrics.push(metric);

  // Keep only recent metrics to prevent memory bloat
  if (metrics.length > MAX_STORED_METRICS) {
    metrics.shift();
  }

  // Log slow operations
  if (duration > 1000) {
    logger.warn('[Performance] Slow operation detected', {
      name,
      duration,
      metadata,
    });
  } else {
    logger.debug('[Performance] Metric recorded', {
      name,
      duration,
      metadata,
    });
  }
}

/**
 * Get all recorded metrics
 */
export function getMetrics() {
  return [...metrics];
}

/**
 * Clear all metrics
 */
export function clearMetrics() {
  logger.debug('[Performance] Clearing', metrics.length, 'metrics');
  metrics.length = 0;
}

/**
 * Get average duration for a specific metric
 */
export function getAverageDuration(name: string): number {
  const filtered = metrics.filter((m) => m.name === name);
  if (filtered.length === 0) return 0;

  const total = filtered.reduce((sum, m) => sum + m.duration, 0);
  return total / filtered.length;
}

/**
 * Log performance summary
 */
export function logPerformanceSummary() {
  const summary = new Map<string, { count: number; avgDuration: number }>();

  metrics.forEach((metric) => {
    const existing = summary.get(metric.name) || { count: 0, avgDuration: 0 };
    const newCount = existing.count + 1;
    const newAvg = (existing.avgDuration * existing.count + metric.duration) / newCount;

    summary.set(metric.name, {
      count: newCount,
      avgDuration: newAvg,
    });
  });

  logger.debug('[Performance Summary]');
  summary.forEach((data, name) => {
    logger.debug(`  ${name}: ${data.count} calls, avg ${data.avgDuration.toFixed(2)}ms`);
  });
}
