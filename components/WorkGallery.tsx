"use client";

import { useState } from "react";
import Link from "next/link";
import DesktopShell from "@/components/desktop/DesktopShell";
import type { Artwork } from "@/lib/types";
import { cropTransform } from "@/lib/crop";
import { isVideo } from "@/lib/media";
import type { IgFeed } from "@/lib/instagram";

export default function WorkGallery({
  artworks,
  instagram,
  emptyNoun = "work",
  minimal = false,
}: {
  artworks: Artwork[];
  instagram?: IgFeed;
  /** Noun used in the empty state, e.g. "work" or "paparazzi". */
  emptyNoun?: string;
  /**
   * Content-only mode (Paparazzi): no title overlay on tiles and no
   * title/medium/year/description panel in the lightbox — just the media.
   */
  minimal?: boolean;
}) {
  const [active, setActive] = useState<Artwork | null>(null);

  // One tile per image, with each project's images kept consecutive so they
  // sit next to each other on the grid. The title rides on the first tile.
  const tiles = artworks.flatMap((art) =>
    art.images.map((src, idx) => ({ art, src, first: idx === 0 })),
  );

  return (
    <DesktopShell
      instagram={instagram}
      defaultOpen={false}
      className="bg-zinc-900 text-white"
    >
      {tiles.length === 0 ? (
        <div className="px-6 py-24 text-center text-sm text-zinc-400">
          <p>No {emptyNoun} uploaded yet.</p>
          <Link href="/admin" className="mt-2 inline-block font-medium text-blue-400 underline">
            Add {emptyNoun} in the studio →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tiles.map(({ art, src, first }, i) => {
            // The manual square framing is set for the cover, so apply it there.
            const framing =
              art.fit === "square" && first ? cropTransform(art.crop) : undefined;
            return (
            <button
              key={`${art.id}-${i}`}
              onClick={() => setActive(art)}
              className={`group relative overflow-hidden bg-zinc-800 ${
                art.fit === "full" ? "self-start" : "aspect-square"
              }`}
            >
              {isVideo(src) ? (
                <video
                  src={src}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  style={framing ? { transform: framing } : undefined}
                  className={`transition-transform duration-300 group-hover:scale-105 ${
                    art.fit === "full"
                      ? "h-auto w-full object-contain"
                      : "h-full w-full object-cover"
                  }`}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={src}
                  alt={art.title}
                  loading="lazy"
                  style={framing ? { transform: framing } : undefined}
                  className={`transition-transform duration-300 group-hover:scale-105 ${
                    art.fit === "full"
                      ? "h-auto w-full object-contain"
                      : "h-full w-full object-cover"
                  }`}
                />
              )}
              {!minimal && first && art.title && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-2 pb-1.5 pt-6 text-left text-xs font-black uppercase leading-none text-white sm:text-sm">
                  {art.title}
                </span>
              )}
            </button>
            );
          })}
        </div>
      )}

      {active && (
        <ProjectModal
          project={active}
          minimal={minimal}
          onClose={() => setActive(null)}
        />
      )}
    </DesktopShell>
  );
}

function ProjectModal({
  project,
  minimal = false,
  onClose,
}: {
  project: Artwork;
  minimal?: boolean;
  onClose: () => void;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const media = project.images[imgIndex] ?? project.images[0];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className={`relative flex h-[85vh] w-full overflow-hidden rounded-lg shadow-2xl ${
          minimal
            ? "max-w-4xl bg-zinc-900"
            : "max-w-5xl flex-col bg-white text-zinc-900 sm:flex-row"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimal (Paparazzi): a floating close button over the media. */}
        {minimal && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-xl leading-none text-white hover:bg-black/80"
          >
            ×
          </button>
        )}

        {/* Media side, with thumbnails when there are several. The pane is a
            fixed size; the media scales to fit inside it (proportions locked,
            small media scaled up) so the window never resizes per item. */}
        <div
          className={`flex flex-col bg-zinc-900 ${
            minimal ? "h-full w-full" : "h-1/2 shrink-0 sm:h-full sm:w-3/5"
          }`}
        >
          <div className="flex min-h-0 flex-1 items-center justify-center p-2">
            {isVideo(media) ? (
              <video
                key={media}
                src={media}
                controls
                autoPlay
                playsInline
                className="h-full w-full object-contain"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={media}
                alt={project.title}
                className="h-full w-full object-contain"
              />
            )}
          </div>
          {project.images.length > 1 && (
            <div className="flex gap-1 overflow-x-auto bg-black/40 p-1.5">
              {project.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`relative h-12 w-12 shrink-0 overflow-hidden rounded ${
                    i === imgIndex ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {isVideo(src) ? (
                    <>
                      <video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-white drop-shadow">▶</span>
                    </>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info side — hidden in minimal (Paparazzi) mode. */}
        {!minimal && (
          <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
            <button
              onClick={onClose}
              aria-label="Close"
              className="ml-auto -mt-2 text-2xl leading-none text-zinc-400 hover:text-zinc-900"
            >
              ×
            </button>
            <h2 className="text-xl font-black uppercase">{project.title}</h2>
            {(project.medium || project.year) && (
              <p className="mt-1 text-sm text-zinc-500">
                {[project.medium, project.year].filter(Boolean).join(" · ")}
              </p>
            )}
            {project.description && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                {project.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
