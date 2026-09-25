import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client. Uses the service role key, which bypasses
 * Row Level Security entirely — that's safe here because this file is only
 * ever imported from server code (lib/store.ts, which is only imported from
 * page.tsx files and app/api/**), never from a "use client" component, so
 * the key never reaches the browser.
 *
 * Requires two environment variables (see .env.local.example):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local " +
      "(local dev) or your hosting provider's environment variables (production)."
  );
}

export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

/** The storage bucket that holds uploaded images/videos. Must be public. */
export const BUCKET = "artworks";

/** The table that holds project metadata. */
export const TABLE = "artworks";

/** Turn a path inside the bucket (e.g. "abc123/0.jpg") into a public URL. */
export function publicUrlFor(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Reverse of publicUrlFor: turn a stored public URL back into the bucket
 * path, so we know what to delete. Returns undefined for anything that
 * doesn't look like one of our own bucket URLs (defensive — e.g. leftover
 * local "/uploads/..." paths from before the Supabase migration).
 */
export function bucketPathFromUrl(imageUrl: string): string | undefined {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = imageUrl.indexOf(marker);
  if (i === -1) return undefined;
  return decodeURIComponent(imageUrl.slice(i + marker.length));
}
