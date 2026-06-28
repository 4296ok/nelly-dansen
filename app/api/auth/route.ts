import { NextResponse } from "next/server";
import { verifyPassword, createSession, destroySession } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!verifyPassword(password ?? "")) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  await createSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
