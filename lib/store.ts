import crypto from "crypto";
import type { Artwork, Category, Crop } from "./types";
import { toCategory } from "./types";
import { parseCrop } from "./crop";
import { supabase, BUCKET, TABLE, publicUrlFor, bucketPathFromUrl } from "./supabase";

/**
 * Supabase-backed store. Metadata lives in the `artworks` table; images and
 * videos live in the `artworks` storage bucket. This replaced the original
 * filesystem-backed version (data/artworks.json + public/uploads/) because
 * Vercel's production filesystem is read-only, so uploads never persisted
 * there.
 *
 * The rest of the app only calls the functions below — no page, component,
 * or API route needed to change for this swap.
 */

// Raw row shape as it comes back from Postgres, before we normalize it.
type Row = {
  id: string;
  title: string;
  description: string;
  medium: string;
  year: string;
  category: string;
  images: string[];
  fit: string;
  crop: unknown;
  order: number;
  created_at: number;
};

function normalize(row: Row): Artwork {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    medium: row.medium,
    year: row.year,
    category: toCategory(row.category),
    images: row.images ?? [],
    fit: row.fit === "full" ? "full" : "square",
    crop: parseCrop(row.crop),
    order: row.order,
    createdAt: Number(row.created_at),
  };
}

export async function getArtworks(category?: Category): Promise<Artwork[]> {
  let query = supabase
    .from(TABLE)
    .select("*")
    .order("order", { ascending: true })
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw error;
  return (data as Row[]).map(normalize);
}

export async function getArtwork(id: string): Promise<Artwork | undefined> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalize(data as Row) : undefined;
}

async function uploadFiles(id: string, files: File[], stamp: string): Promise<string[]> {
  const images: string[] = [];
  for (const [i, file] of files.entries()) {
    const ext = extFromName(file.name) || ".jpg";
    const path = `${id}/${stamp}-${i}${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type || undefined, upsert: false });
    if (error) throw error;
    images.push(publicUrlFor(path));
  }
  return images;
}

export async function addArtwork(input: {
  title: string;
  description: string;
  medium: string;
  year: string;
  fit?: "square" | "full";
  crop?: Crop;
  category?: Category;
  files: File[];
}): Promise<Artwork> {
  const id = crypto.randomUUID();
  const images = await uploadFiles(id, input.files, "0");

  // New work goes to the top: one lower than the current minimum order.
  const { data: minRow } = await supabase
    .from(TABLE)
    .select("order")
    .order("order", { ascending: true })
    .limit(1)
    .maybeSingle();
  const minOrder = minRow ? (minRow as { order: number }).order : 0;

  const row: Row = {
    id,
    title: input.title.trim() || "Untitled",
    description: input.description.trim(),
    medium: input.medium.trim(),
    year: input.year.trim(),
    category: toCategory(input.category),
    images,
    fit: input.fit === "full" ? "full" : "square",
    crop: input.fit === "full" ? null : parseCrop(input.crop) ?? null,
    order: minOrder - 1,
    created_at: Date.now(),
  };

  const { error } = await supabase.from(TABLE).insert(row);
  if (error) throw error;
  return normalize(row);
}

export async function updateArtwork(
  id: string,
  input: {
    title?: string;
    description?: string;
    medium?: string;
    year?: string;
    fit?: "square" | "full";
    /** `null` clears the crop back to a plain centered square; undefined leaves it. */
    crop?: Crop | null;
    category?: Category;
    order?: number;
    /** Existing image URLs to drop from this project. */
    removeImages?: string[];
    /** New image files to append to this project. */
    files?: File[];
  }
): Promise<Artwork | undefined> {
  const { data: currentRow, error: fetchError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!currentRow) return undefined;
  const current = normalize(currentRow as Row);

  // Start from the images we're keeping, then append any new uploads.
  const remove = new Set(input.removeImages ?? []);
  let images = current.images.filter((img) => !remove.has(img));

  if (input.files?.length) {
    const uploaded = await uploadFiles(id, input.files, String(Date.now()));
    images = images.concat(uploaded);
  }

  // Best-effort delete of the dropped files from storage.
  for (const img of remove) {
    const path = bucketPathFromUrl(img);
    if (!path) continue;
    try {
      await supabase.storage.from(BUCKET).remove([path]);
    } catch {
      // ignore missing file
    }
  }

  const fit = input.fit ?? current.fit;
  // A plain (non-square) thumbnail can't be reframed, so drop any crop there.
  const crop =
    fit === "full"
      ? undefined
      : input.crop !== undefined
        ? input.crop ?? undefined
        : current.crop;

  const next: Row = {
    id: current.id,
    title: input.title !== undefined ? input.title.trim() || "Untitled" : current.title,
    description:
      input.description !== undefined ? input.description.trim() : current.description,
    medium: input.medium !== undefined ? input.medium.trim() : current.medium,
    year: input.year !== undefined ? input.year.trim() : current.year,
    category: input.category ?? current.category,
    images,
    fit,
    crop: crop ?? null,
    order: input.order ?? current.order,
    created_at: current.createdAt,
  };

  const { error } = await supabase.from(TABLE).update(next).eq("id", id);
  if (error) throw error;
  return normalize(next);
}

/**
 * Persist a new project order. `orderedIds` is the desired sequence (typically
 * one gallery's projects, top to bottom); each listed project's `order` is set
 * to its index. Projects not in the list keep their current order — since
 * `getArtworks` sorts within a filtered category, that's safe across galleries.
 */
export async function reorderArtworks(orderedIds: string[]): Promise<void> {
  // One update per row. The dataset is a portfolio (tens of pieces, not
  // thousands), so this is simpler and safer than a bulk upsert, which would
  // need every NOT NULL column supplied to satisfy Postgres's insert path.
  await Promise.all(
    orderedIds.map((id, i) => supabase.from(TABLE).update({ order: i }).eq("id", id))
  );
}

export async function deleteArtwork(id: string): Promise<boolean> {
  const { data: row, error: fetchError } = await supabase
    .from(TABLE)
    .select("images")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!row) return false;

  const paths = ((row as { images: string[] }).images ?? [])
    .map(bucketPathFromUrl)
    .filter((p): p is string => Boolean(p));
  if (paths.length) {
    try {
      await supabase.storage.from(BUCKET).remove(paths);
    } catch {
      // ignore missing files
    }
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
  return true;
}

function extFromName(name: string): string {
  const m = /\.[a-z0-9]+$/i.exec(name);
  return m ? m[0].toLowerCase() : "";
}
