import { NextResponse } from "next/server";
import { getArtworks, addArtwork } from "@/lib/store";
import { toCategory } from "@/lib/types";
import { parseCrop } from "@/lib/crop";
import { isImageOrVideoType } from "@/lib/media";
import { isAuthed } from "@/lib/auth";

export async function GET() {
  const items = await getArtworks();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const form = await req.formData();
  const files = form
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
  }
  if (files.some((f) => !isImageOrVideoType(f.type))) {
    return NextResponse.json(
      { error: "All files must be images or videos" },
      { status: 400 },
    );
  }

  const artwork = await addArtwork({
    title: String(form.get("title") ?? ""),
    description: String(form.get("description") ?? ""),
    medium: String(form.get("medium") ?? ""),
    year: String(form.get("year") ?? ""),
    fit: form.get("fit") === "full" ? "full" : "square",
    crop: parseCrop(form.get("crop")),
    category: toCategory(form.get("category")),
    files,
  });

  return NextResponse.json(artwork, { status: 201 });
}
