import { NextResponse } from "next/server";
import { verifyPassword, createSession, destroySession } from "@/lib/auth";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit before touching the password, so guesses are throttled whether
  // they're right or wrong.
  const ip = clientIp(req);
  const limit = rateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const { password } = await req.json().catch(() => ({ password: "" }));

  let ok: boolean;
  try {
    ok = verifyPassword(password ?? "");
  } catch (err) {
    // ADMIN_PASSWORD isn't configured. Say so plainly rather than letting it
    // surface as a generic 500 that looks like a wrong password.
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Admin is not configured." },
      { status: 500 },
    );
  }

  if (!ok) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  resetRateLimit(ip);
  await createSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
