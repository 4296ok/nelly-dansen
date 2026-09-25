/**
 * Media in a project can be either images or videos. Both are stored as plain
 * file paths in `Artwork.images`, so we tell them apart by extension.
 */
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg|ogv)$/i;

/** True when a stored path (or file name) points at a video, not an image. */
export function isVideo(src: string): boolean {
  return VIDEO_EXT.test(src);
}

/** True for an uploaded file's MIME type we accept (image or video). */
export function isImageOrVideoType(type: string): boolean {
  return type.startsWith("image/") || type.startsWith("video/");
}

/**
 * Largest file Supabase Storage will accept on the free plan (50 MB). Uploads
 * over this are rejected by the storage API with "The object exceeded the
 * maximum allowed size", so we check up front instead — both in the browser
 * (instant feedback) and on the server (the real guard).
 *
 * Raising the plan raises this limit; keep it in step with the bucket's
 * configured `file_size_limit`.
 */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** True when a picked file is too big to upload. */
export function isTooLarge(size: number): boolean {
  return size > MAX_UPLOAD_BYTES;
}

/** Human-readable size for error messages, e.g. "79 MB". */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Message shown when a file is over the limit. Says what to do about it —
 * "too large" on its own leaves you guessing.
 */
export function tooLargeMessage(names: string[]): string {
  const list = names.join(", ");
  const limit = formatSize(MAX_UPLOAD_BYTES);
  return (
    `${names.length > 1 ? "These files are" : "This file is"} over the ${limit} ` +
    `upload limit: ${list}. Compress the video (or export it smaller) and try again.`
  );
}
