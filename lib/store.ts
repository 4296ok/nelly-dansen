import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { Artwork } from "./types";

/**
 * Local, filesystem-backed store. Metadata lives in data/artworks.json and
 * images live in public/uploads. This is perfect for developing locally.
 *
 * NOTE: Vercel's filesystem is read-only in production, so when you go live
 * you'll swap these functions for Supabase (database + storage). The rest of
 * the app only calls the functions below, so that swap stays contained here.
 */

const DATA_FILE = path.join(process.cwd(), "data", "artworks.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function readAll(): Promise<Artwork[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const items = JSON.parse(raw) as (Artwork & { image?: string })[];
    return items.map(normalize);
  } catch {
    return [];
  }
}

// Tolerate older records that stored a single `image` instead of `images[]`.
function normalize(item: Artwork & { image?: string }): Artwork {
  const images =
    item.images && item.images.length
      ? item.images
      : item.image
        ? [item.image]
        : [];
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    medium: item.medium,
    year: item.year,
    images,
    order: item.order,
    createdAt: item.createdAt,
  };
}

async function writeAll(items: Artwork[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2));
}

export async function getArtworks(): Promise<Artwork[]> {
  const items = await readAll();
  return items.sort((a, b) => a.order - b.order || b.createdAt - a.createdAt);
}

export async function getArtwork(id: string): Promise<Artwork | undefined> {
  const items = await readAll();
  return items.find((a) => a.id === id);
}

export async function addArtwork(input: {
  title: string;
  description: string;
  medium: string;
  year: string;
  files: File[];
}): Promise<Artwork> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const id = crypto.randomUUID();
  const images: string[] = [];
  for (const [i, file] of input.files.entries()) {
    const ext = extFromName(file.name) || ".jpg";
    const filename = `${id}-${i}${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);
    images.push(`/uploads/${filename}`);
  }

  const items = await readAll();
  const minOrder = items.reduce((m, a) => Math.min(m, a.order), 0);

  const artwork: Artwork = {
    id,
    title: input.title.trim() || "Untitled",
    description: input.description.trim(),
    medium: input.medium.trim(),
    year: input.year.trim(),
    images,
    order: minOrder - 1, // newest shows first by default
    createdAt: Date.now(),
  };

  items.push(artwork);
  await writeAll(items);
  return artwork;
}

export async function updateArtwork(
  id: string,
  input: {
    title?: string;
    description?: string;
    medium?: string;
    year?: string;
    order?: number;
    /** Existing image paths to drop from this project. */
    removeImages?: string[];
    /** New image files to append to this project. */
    files?: File[];
  }
): Promise<Artwork | undefined> {
  const items = await readAll();
  const idx = items.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  const current = items[idx];

  // Start from the images we're keeping, then append any new uploads.
  const remove = new Set(input.removeImages ?? []);
  const images = current.images.filter((img) => !remove.has(img));

  if (input.files?.length) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const stamp = Date.now();
    for (const [i, file] of input.files.entries()) {
      const ext = extFromName(file.name) || ".jpg";
      const filename = `${id}-${stamp}-${i}${ext}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);
      images.push(`/uploads/${filename}`);
    }
  }

  // Best-effort delete of the dropped image files.
  for (const img of remove) {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, img.replace(/^\/uploads\//, "")));
    } catch {
      // ignore missing file
    }
  }

  const next: Artwork = {
    ...current,
    title: input.title !== undefined ? input.title.trim() || "Untitled" : current.title,
    description:
      input.description !== undefined ? input.description.trim() : current.description,
    medium: input.medium !== undefined ? input.medium.trim() : current.medium,
    year: input.year !== undefined ? input.year.trim() : current.year,
    order: input.order ?? current.order,
    images,
  };
  items[idx] = next;
  await writeAll(items);
  return next;
}

export async function deleteArtwork(id: string): Promise<boolean> {
  const items = await readAll();
  const target = items.find((a) => a.id === id);
  if (!target) return false;

  // Best-effort remove of every image file for this project.
  for (const image of target.images) {
    try {
      const filename = image.replace(/^\/uploads\//, "");
      await fs.unlink(path.join(UPLOAD_DIR, filename));
    } catch {
      // ignore missing file
    }
  }

  await writeAll(items.filter((a) => a.id !== id));
  return true;
}

function extFromName(name: string): string {
  const m = /\.[a-z0-9]+$/i.exec(name);
  return m ? m[0].toLowerCase() : "";
}
