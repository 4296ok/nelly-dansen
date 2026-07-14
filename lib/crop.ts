import type { Crop } from "./types";

/** A centered, un-zoomed crop — the default framing. */
export const DEFAULT_CROP: Crop = { scale: 1, x: 0, y: 0 };

/**
 * How far the image can be panned (as a fraction of the frame) before its
 * edge would show inside the square. `aspect` is naturalWidth / naturalHeight.
 */
export function maxOffset(scale: number, aspect: number): { x: number; y: number } {
  // Size the image covers the frame at, before zoom, as a multiple of the frame.
  const coverW = aspect >= 1 ? aspect : 1;
  const coverH = aspect >= 1 ? 1 : 1 / aspect;
  return {
    x: Math.max(0, (coverW * scale - 1) / 2),
    y: Math.max(0, (coverH * scale - 1) / 2),
  };
}

/** Keep `scale >= 1` and clamp the pan so the frame stays fully covered. */
export function clampCrop(crop: Crop, aspect: number): Crop {
  const scale = Math.max(1, crop.scale);
  const m = maxOffset(scale, aspect);
  return {
    scale,
    x: Math.max(-m.x, Math.min(m.x, crop.x)),
    y: Math.max(-m.y, Math.min(m.y, crop.y)),
  };
}

/**
 * CSS `transform` for an object-cover <img> that fills a square frame. Pairs a
 * translate (percent of the frame) with a scale, so it renders the same at any
 * size. Returns undefined for the default framing (no transform needed).
 */
export function cropTransform(crop: Crop | undefined): string | undefined {
  if (!crop || (crop.scale === 1 && crop.x === 0 && crop.y === 0)) return undefined;
  return `translate(${crop.x * 100}%, ${crop.y * 100}%) scale(${crop.scale})`;
}

/** Coerce untrusted input (form field / stored JSON) into a valid Crop, or undefined. */
export function parseCrop(raw: unknown): Crop | undefined {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  if (!value || typeof value !== "object") return undefined;
  const { scale, x, y } = value as Record<string, unknown>;
  if (typeof scale !== "number" || typeof x !== "number" || typeof y !== "number") {
    return undefined;
  }
  if (![scale, x, y].every(Number.isFinite)) return undefined;
  const crop: Crop = { scale: Math.max(1, scale), x, y };
  return cropTransform(crop) ? crop : undefined;
}
