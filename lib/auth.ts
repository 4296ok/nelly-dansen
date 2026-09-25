import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "pf_session";

/**
 * The admin password, from the environment.
 *
 * There is deliberately no fallback. This used to default to "changeme", which
 * is convenient locally but means a deploy that forgets the variable silently
 * opens the admin area with a password published in the repo. Failing loudly
 * is the safer default: the message says exactly what to do.
 */
function adminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    throw new Error(
      "ADMIN_PASSWORD is not set, so the admin area is disabled. Add it to " +
        ".env.local for local development, or to your hosting provider's " +
        "environment variables in production.",
    );
  }
  return pw;
}

/**
 * Opaque session token derived from the password, so the raw password is never
 * stored in the cookie. Changing the password invalidates every old session.
 */
function expectedToken(): string {
  return crypto.createHash("sha256").update(adminPassword()).digest("hex").slice(0, 32);
}

/**
 * Compare in constant time.
 *
 * A plain `===` bails out at the first differing character, so the time it
 * takes leaks how much of the guess was right. Hashing first gives two equal
 * 32-byte buffers (timingSafeEqual throws on length mismatch, and the lengths
 * would otherwise leak the password's length too).
 *
 * Throws if ADMIN_PASSWORD is unset — see adminPassword().
 */
export function verifyPassword(password: string): boolean {
  const a = crypto.createHash("sha256").update(password).digest();
  const b = crypto.createHash("sha256").update(adminPassword()).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function createSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/**
 * Whether the current request carries a valid session.
 *
 * Returns false rather than throwing when ADMIN_PASSWORD is missing: pages call
 * this to decide whether to show the dashboard or the login form, and a throw
 * here would turn a misconfiguration into a 500 on every page. The login
 * attempt itself surfaces the real reason.
 */
export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expectedToken());
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    // ADMIN_PASSWORD unset — treat as not signed in.
    return false;
  }
}
