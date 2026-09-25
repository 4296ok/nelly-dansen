import { MAX_UPLOAD_BYTES, formatSize } from "./media";

/**
 * Turn an error thrown by the store (usually straight from Supabase) into a
 * sentence worth showing in the admin.
 *
 * Supabase's own messages are written for developers — "The object exceeded
 * the maximum allowed size" doesn't say what the limit is or what to do — so
 * the cases we can actually recognise get rewritten, and anything unexpected
 * is passed through rather than swallowed.
 */
export function storageErrorMessage(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "";

  const text = raw.toLowerCase();

  if (text.includes("exceeded the maximum allowed size") || text.includes("payload too large")) {
    return (
      `That file is over the ${formatSize(MAX_UPLOAD_BYTES)} upload limit. ` +
      `Compress the video (or export it smaller) and try again.`
    );
  }
  if (text.includes("bucket not found")) {
    return "The 'artworks' storage bucket is missing in Supabase. Create it and mark it public.";
  }
  if (text.includes("duplicate") || text.includes("already exists")) {
    return "A file with that name is already stored. Try again — a new name will be generated.";
  }
  if (text.includes("jwt") || text.includes("invalid api key") || text.includes("unauthorized")) {
    return "Supabase rejected the credentials. Check SUPABASE_SERVICE_ROLE_KEY.";
  }
  if (text.includes("fetch failed") || text.includes("network") || text.includes("timeout")) {
    return "Couldn't reach Supabase. Check your connection and try again.";
  }

  return raw ? `Upload failed: ${raw}` : "Upload failed for an unknown reason.";
}
