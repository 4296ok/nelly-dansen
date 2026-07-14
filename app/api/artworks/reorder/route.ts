import { NextResponse } from "next/server";
import { reorderArtworks } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const ids: unknown = body?.ids;
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "ids must be an array of strings" }, { status: 400 });
  }

  await reorderArtworks(ids as string[]);
  return NextResponse.json({ ok: true });
}
