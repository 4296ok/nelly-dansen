import { NextResponse } from "next/server";
import { updateArtwork, deleteArtwork } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const { id } = await params;

  const form = await req.formData();
  const files = form
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.some((f) => !f.type.startsWith("image/"))) {
    return NextResponse.json({ error: "All files must be images" }, { status: 400 });
  }
  const removeImages = form.getAll("removeImages").map(String);
  const str = (k: string) =>
    form.get(k) !== null ? String(form.get(k)) : undefined;

  const updated = await updateArtwork(id, {
    title: str("title"),
    description: str("description"),
    medium: str("medium"),
    year: str("year"),
    removeImages,
    files,
  });
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteArtwork(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
