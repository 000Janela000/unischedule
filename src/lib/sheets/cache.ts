const cache = new Map<string, { data: unknown; expiresAt: number }>();

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Returns cached data if it exists and hasn't expired, otherwise null.
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Stores data in the cache with a time-to-live.
 */
export function setCached<T>(key: string, data: T, ttl?: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + (ttl ?? DEFAULT_TTL),
  });
}

/**
 * Removes a specific key from the cache.
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Clears all entries from the cache.
 */
export function clearCache(): void {
  cache.clear();
}
