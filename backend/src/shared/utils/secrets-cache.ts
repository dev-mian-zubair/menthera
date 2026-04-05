/**
 * Secrets caching utility to reduce Secrets Manager API calls
 * Implements TTL-based caching with Lambda execution context reuse
 */

import { CACHE_CONFIG } from '../config/timeouts.config';

interface CachedSecret {
  value: any;
  expiresAt: number;
}

// In-memory cache (persists across warm Lambda invocations)
const secretsCache = new Map<string, CachedSecret>();

// Default TTL from centralized config
const DEFAULT_TTL_MS = CACHE_CONFIG.secretsTtlMs;

/**
 * Get a secret from cache or fetch from Secrets Manager
 */
export async function getCachedSecret<T = any>(
  secretId: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const now = Date.now();

  // Check if secret exists in cache and is not expired
  const cached = secretsCache.get(secretId);
  if (cached && cached.expiresAt > now) {
    console.log(`[SecretsCache] ✓ Cache HIT for ${secretId} (expires in ${Math.round((cached.expiresAt - now) / 1000)}s)`);
    return cached.value as T;
  }

  // Cache miss or expired - fetch from Secrets Manager
  console.log(`[SecretsCache] ⚠️ Cache MISS for ${secretId}, fetching...`);
  const value = await fetchFn();

  // Store in cache with TTL
  const expiresAt = now + ttlMs;
  secretsCache.set(secretId, { value, expiresAt });

  console.log(`[SecretsCache] ✓ Cached ${secretId} (expires in ${Math.round(ttlMs / 1000)}s)`);

  return value;
}

/**
 * Clear a specific secret from cache
 */
export function clearSecret(secretId: string): void {
  secretsCache.delete(secretId);
  console.log(`[SecretsCache] Cleared cache for ${secretId}`);
}

/**
 * Clear all cached secrets
 */
export function clearAllSecrets(): void {
  secretsCache.clear();
  console.log('[SecretsCache] Cleared all cached secrets');
}

/**
 * Get cache statistics (useful for monitoring)
 */
export function getCacheStats() {
  const now = Date.now();
  const stats = {
    totalEntries: secretsCache.size,
    expiredEntries: 0,
    validEntries: 0,
  };

  for (const [key, cached] of secretsCache.entries()) {
    if (cached.expiresAt <= now) {
      stats.expiredEntries++;
    } else {
      stats.validEntries++;
    }
  }

  return stats;
}

/**
 * Clean up expired secrets from cache
 */
export function cleanupExpiredSecrets(): void {
  const now = Date.now();
  let removed = 0;

  for (const [key, cached] of secretsCache.entries()) {
    if (cached.expiresAt <= now) {
      secretsCache.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`[SecretsCache] Cleaned up ${removed} expired secret(s)`);
  }
}
