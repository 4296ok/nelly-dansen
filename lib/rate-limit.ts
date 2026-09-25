/**
 * Minimal in-memory rate limiter, used to slow down password guessing on
 * /api/auth.
 *
 * Deliberately simple, and worth being honest about what it is:
 *
 *   - State lives in this process's memory, so it resets on restart and each
 *     serverless instance keeps its own count. An attacker spread across many
 *     instances gets more attempts than the number below suggests.
 *   - It keys on the client IP, which behind a proxy is only as trustworthy as
 *     the proxy. On Vercel `x-forwarded-for` is set by the platform.
 *
 * It is a speed bump, not a wall — it turns "unlimited guesses at full speed"
 * into something that takes real time. For a single-admin portfolio that is
 * the right amount of machinery. A shared store (Supabase, Upstash) would be
 * the next step if this ever needed to be airtight.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Attempts allowed per window, per IP. */
const MAX_ATTEMPTS = 10;
/** Window length: 15 minutes. */
const WINDOW_MS = 15 * 60 * 1000;
/** Stop the map growing without bound on a busy or hostile server. */
const MAX_TRACKED_IPS = 10_000;

/** Best-effort client IP for a request. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  // x-forwarded-for is a comma-separated chain; the first entry is the client.
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Record an attempt for `key` and say whether it is allowed. Call this before
 * checking the password, so failures and successes both count.
 */
export function rateLimit(key: string): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_IPS) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - bucket.count };
}

/** Clear a key's attempts — called after a successful sign-in. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
