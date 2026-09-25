import { NextResponse } from "next/server";
import { updateArtwork, deleteArtwork } from "@/lib/store";
import { toCategory } from "@/lib/types";
import { parseCrop } from "@/lib/crop";
import { isImageOrVideoType, isTooLarge, tooLargeMessage } from "@/lib/media";
import { isAuthed } from "@/lib/auth";
import { storageErrorMessage } from "@/lib/errors";

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
  if (files.some((f) => !isImageOrVideoType(f.type))) {
    return NextResponse.json(
      { error: "All files must be images or videos" },
      { status: 400 },
    );
  }
  // Same up-front size check as the create route — see the note there.
  const oversized = files.filter((f) => isTooLarge(f.size));
  if (oversized.length) {
    return NextResponse.json(
      { error: tooLargeMessage(oversized.map((f) => f.name)) },
      { status: 413 },
    );
  }
  const removeImages = form.getAll("removeImages").map(String);
  const str = (k: string) =>
    form.get(k) !== null ? String(form.get(k)) : undefined;
  const fitRaw = form.get("fit");
  const fit =
    fitRaw === null ? undefined : fitRaw === "full" ? "full" : "square";
  // Present-but-default parses to undefined, which we treat as "clear" (null).
  const crop = form.get("crop") === null ? undefined : parseCrop(form.get("crop")) ?? null;
  const category =
    form.get("category") === null ? undefined : toCategory(form.get("category"));

  try {
    const updated = await updateArtwork(id, {
      title: str("title"),
      description: str("description"),
      medium: str("medium"),
      year: str("year"),
      fit,
      crop,
      category,
      removeImages,
      files,
    });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: storageErrorMessage(err) }, { status: 500 });
  }
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
