"use client";

import { useState } from "react";
import Link from "next/link";
import DesktopShell from "@/components/desktop/DesktopShell";
import type { Artwork } from "@/lib/types";
import type { IgFeed } from "@/lib/instagram";

export default function WorkGallery({
  artworks,
  instagram,
}: {
  artworks: Artwork[];
  instagram?: IgFeed;
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
          <p>No work uploaded yet.</p>
          <Link href="/admin" className="mt-2 inline-block font-medium text-blue-400 underline">
            Add work in the studio →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1 p-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tiles.map(({ art, src, first }, i) => (
            <button
              key={`${art.id}-${i}`}
              onClick={() => setActive(art)}
              className="group relative aspect-square overflow-hidden bg-zinc-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={art.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {first && art.title && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-2 pb-1.5 pt-6 text-left text-xs font-black uppercase leading-none text-white sm:text-sm">
                  {art.title}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {active && <ProjectModal project={active} onClose={() => setActive(null)} />}
    </DesktopShell>
  );
}

function ProjectModal({
  project,
  onClose,
}: {
  project: Artwork;
  onClose: () => void;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const image = project.images[imgIndex] ?? project.images[0];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white text-zinc-900 shadow-2xl sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image side, with thumbnails when there are several. The pane is a
            fixed size; the image scales to fit inside it (proportions locked,
            small images scaled up) so the window never resizes per image. */}
        <div className="flex h-1/2 shrink-0 flex-col bg-zinc-900 sm:h-full sm:w-3/5">
          <div className="flex min-h-0 flex-1 items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={project.title}
              className="h-full w-full object-contain"
            />
          </div>
          {project.images.length > 1 && (
            <div className="flex gap-1 overflow-x-auto bg-black/40 p-1.5">
              {project.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`h-12 w-12 shrink-0 overflow-hidden rounded ${
                    i === imgIndex ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info side */}
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
      </div>
    </div>
  );
}
