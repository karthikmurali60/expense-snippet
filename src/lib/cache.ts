/**
 * Simple in-memory cache implementation
 */

interface CacheOptions {
  ttl: number; // Time to live in milliseconds
}

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

class Cache {
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private defaultOptions: CacheOptions = { ttl: 5 * 60 * 1000 }; // 5 minutes default

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options
   */
  set<T>(key: string, value: T, options?: Partial<CacheOptions>): void {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    this.cache.set(key, {
      value,
      timestamp: Date.now() + mergedOptions.ttl
    });
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // Check if the item has expired
    if (Date.now() > item.timestamp) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns true if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Check if the item has expired
    if (Date.now() > item.timestamp) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a key from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all keys in the cache
   * @returns Array of cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get the size of the cache
   * @returns Number of items in the cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Export a singleton instance
export const cache = new Cache(); 