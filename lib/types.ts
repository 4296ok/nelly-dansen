export type Artwork = {
  id: string;
  title: string;
  description: string;
  /** Free text — may list several mediums, e.g. "Oil on canvas, video, sound" */
  medium: string;
  year: string;
  /** Public paths to the images, e.g. ["/uploads/abc-0.jpg"]. First is the cover. */
  images: string[];
  /** Lower numbers show first */
  order: number;
  createdAt: number;
};
