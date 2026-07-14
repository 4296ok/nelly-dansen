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
