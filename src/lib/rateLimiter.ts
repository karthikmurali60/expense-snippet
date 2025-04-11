/**
 * Simple in-memory rate limiter for client-side operations
 * Note: This is a basic implementation. For production, consider using a server-side rate limiter.
 */

interface RateLimitConfig {
  maxRequests: number;
  timeWindowMs: number;
}

interface RateLimitState {
  timestamps: number[];
  config: RateLimitConfig;
}

// Store rate limit states for different operations
const rateLimitStates = new Map<string, RateLimitState>();

/**
 * Check if an operation is rate limited
 * @param key Unique identifier for the operation
 * @param config Rate limit configuration
 * @returns true if the operation is allowed, false if rate limited
 */
export const isRateLimited = (key: string, config: RateLimitConfig): boolean => {
  const now = Date.now();
  
  // Initialize state if it doesn't exist
  if (!rateLimitStates.has(key)) {
    rateLimitStates.set(key, {
      timestamps: [],
      config
    });
  }
  
  const state = rateLimitStates.get(key)!;
  
  // Remove timestamps outside the time window
  state.timestamps = state.timestamps.filter(
    timestamp => now - timestamp < state.config.timeWindowMs
  );
  
  // Check if we're over the limit
  if (state.timestamps.length >= state.config.maxRequests) {
    return true; // Rate limited
  }
  
  // Add current timestamp
  state.timestamps.push(now);
  
  return false; // Not rate limited
};

/**
 * Get the time until the rate limit resets
 * @param key Unique identifier for the operation
 * @returns Time in milliseconds until the rate limit resets, or 0 if not rate limited
 */
export const getTimeUntilReset = (key: string): number => {
  const state = rateLimitStates.get(key);
  if (!state || state.timestamps.length === 0) {
    return 0;
  }
  
  const now = Date.now();
  const oldestTimestamp = state.timestamps[0];
  const resetTime = oldestTimestamp + state.config.timeWindowMs;
  
  return Math.max(0, resetTime - now);
};

/**
 * Reset the rate limit for a specific operation
 * @param key Unique identifier for the operation
 */
export const resetRateLimit = (key: string): void => {
  if (rateLimitStates.has(key)) {
    rateLimitStates.get(key)!.timestamps = [];
  }
};

// Predefined rate limit configurations
export const rateLimits = {
  // Default: 10 requests per minute
  default: { maxRequests: 10, timeWindowMs: 60 * 1000 },
  
  // Strict: 5 requests per minute
  strict: { maxRequests: 5, timeWindowMs: 60 * 1000 },
  
  // Loose: 30 requests per minute
  loose: { maxRequests: 30, timeWindowMs: 60 * 1000 },
  
  // Per second: 2 requests per second
  perSecond: { maxRequests: 2, timeWindowMs: 1000 }
}; 