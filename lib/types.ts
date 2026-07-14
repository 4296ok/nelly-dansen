/**
 * Instagram-style framing for a square thumbnail. `scale` zooms in (>= 1);
 * `x`/`y` pan the image as a fraction of the frame width (0 = centered,
 * positive moves the image right/down). Applied on top of an object-cover
 * fill, so it renders identically at any pixel size. Only meaningful when
 * `fit === "square"`.
 */
export type Crop = { scale: number; x: number; y: number };

/** The galleries a project can live in. */
export type Category = "work" | "paparazzi";

/** Categories in display order, with their labels — used for the admin tabs. */
export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "work", label: "Work" },
  { id: "paparazzi", label: "Paparazzi" },
];

/** Coerce untrusted input into a valid category, defaulting to "work". */
export function toCategory(raw: unknown): Category {
  return raw === "paparazzi" ? "paparazzi" : "work";
}

export type Artwork = {
  id: string;
  title: string;
  description: string;
  /** Free text — may list several mediums, e.g. "Oil on canvas, video, sound" */
  medium: string;
  year: string;
  /**
   * Which gallery this belongs to: the main "work" grid or the "paparazzi"
   * grid. Older records without this field are treated as "work".
   */
  category: "work" | "paparazzi";
  /** Public paths to the images, e.g. ["/uploads/abc-0.jpg"]. First is the cover. */
  images: string[];
  /**
   * How thumbnails are shown in the work grid:
   * "square" — cropped to a square (default); "full" — full image at its
   * natural aspect ratio, filling the column width without cropping.
   */
  fit: "square" | "full";
  /**
   * How the cover is framed when `fit === "square"`. Omitted means a plain
   * centered crop (equivalent to { scale: 1, x: 0, y: 0 }).
   */
  crop?: Crop;
  /** Lower numbers show first */
  order: number;
  createdAt: number;
};
