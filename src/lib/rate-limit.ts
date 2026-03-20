import { NextResponse } from "next/server";

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

const stores = new Map<string, Map<string, number[]>>();

function getStore(key: string): Map<string, number[]> {
  if (!stores.has(key)) {
    stores.set(key, new Map());
  }
  return stores.get(key)!;
}

/**
 * Check rate limit for a given identifier (e.g. userId or IP).
 * Returns a 429 NextResponse if the limit is exceeded, otherwise null.
 */
export function checkRateLimit(
  storeKey: string,
  identifier: string,
  config: RateLimitConfig
): NextResponse | null {
  const { limit, windowSec } = config;
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const store = getStore(storeKey);

  const timestamps = store.get(identifier) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  recent.push(now);
  store.set(identifier, recent);

  if (recent.length > limit) {
    const retryAfter = Math.ceil(
      (recent[0] + windowMs - now) / 1000
    );
    return NextResponse.json(
      { error: "Too many requests, please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil((recent[0] + windowMs) / 1000)),
        },
      }
    );
  }

  return null;
}

// Pre-configured limiters for common use cases
export const rateLimits = {
  /** Write actions: tweets, comments, messages (10/min) */
  write: (userId: string, route: string) =>
    checkRateLimit(`write:${route}`, userId, { limit: 10, windowSec: 60 }),

  /** Like/follow actions (30/min) */
  social: (userId: string, route: string) =>
    checkRateLimit(`social:${route}`, userId, { limit: 30, windowSec: 60 }),

  /** Read/search actions (60/min) */
  read: (userId: string, route: string) =>
    checkRateLimit(`read:${route}`, userId, { limit: 60, windowSec: 60 }),

  /** Auth actions: register (5/15min) */
  auth: (ip: string) =>
    checkRateLimit("auth:register", ip, { limit: 5, windowSec: 900 }),

  /** Profile updates (5/min) */
  profile: (userId: string) =>
    checkRateLimit("profile:update", userId, { limit: 5, windowSec: 60 }),
};
