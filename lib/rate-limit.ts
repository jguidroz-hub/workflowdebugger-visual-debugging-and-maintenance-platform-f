/**
 * In-memory rate limiter for auth endpoints.
 * 
 * Production note: For multi-instance deployments, replace with Redis-based
 * rate limiting (e.g., @upstash/ratelimit). This in-memory version works
 * for single-instance Vercel/Railway deployments.
 * 
 * Cleans up expired entries every 5 minutes to prevent memory leaks.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix ms
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Max requests in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { limit: 5, windowMs: 15 * 60 * 1000 }
): RateLimitResult {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + config.windowMs };
    store.set(key, entry);
  }

  entry.count++;

  const allowed = entry.count <= config.limit;
  const remaining = Math.max(0, config.limit - entry.count);
  const retryAfterMs = allowed ? 0 : entry.resetAt - now;

  return { allowed, remaining, resetAt: entry.resetAt, retryAfterMs };
}

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}
