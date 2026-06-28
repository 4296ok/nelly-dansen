import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "pf_session";

function expectedToken(): string {
  const pw = process.env.ADMIN_PASSWORD || "changeme";
  // Derive an opaque token from the password so the raw password is never
  // stored in the cookie. Changing the password invalidates old sessions.
  return crypto.createHash("sha256").update(pw).digest("hex").slice(0, 32);
}

export function verifyPassword(password: string): boolean {
  return password === (process.env.ADMIN_PASSWORD || "changeme");
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

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === expectedToken();
}
