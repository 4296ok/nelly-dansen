"use client";

import { useRef, useState } from "react";
import type { Crop } from "@/lib/types";
import { clampCrop, cropTransform, DEFAULT_CROP } from "@/lib/crop";
import { isVideo } from "@/lib/media";

/**
 * Instagram-style square framer. Drag the image to pan and use the slider to
 * zoom; the square outline is exactly what visitors see in the work grid. Crop
 * values are normalized (fractions of the frame), so the same numbers reproduce
 * the framing at any display size.
 */
export default function SquareCropper({
  src,
  crop,
  onChange,
}: {
  src: string;
  crop: Crop;
  onChange: (crop: Crop) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1);
  // Pointer + crop position at the moment a drag started.
  const drag = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, cx: crop.x, cy: crop.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !frameRef.current) return;
    const size = frameRef.current.clientWidth || 1;
    const dx = (e.clientX - drag.current.px) / size;
    const dy = (e.clientY - drag.current.py) / size;
    onChange(
      clampCrop({ scale: crop.scale, x: drag.current.cx + dx, y: drag.current.cy + dy }, aspect),
    );
  }

  function endDrag() {
    drag.current = null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative aspect-square w-40 cursor-grab touch-none select-none overflow-hidden rounded-md border border-line bg-zinc-100 active:cursor-grabbing"
      >
        {isVideo(src) ? (
          <video
            src={src}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              const ar = v.videoWidth / v.videoHeight || 1;
              setAspect(ar);
              onChange(clampCrop(crop, ar));
            }}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{ transform: cropTransform(crop) }}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt="Adjust the square thumbnail"
            draggable={false}
            onLoad={(e) => {
              const ar = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight || 1;
              setAspect(ar);
              // Re-clamp in case a stored crop was tighter than this image allows.
              onChange(clampCrop(crop, ar));
            }}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{ transform: cropTransform(crop) }}
          />
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={crop.scale}
          onChange={(e) =>
            onChange(clampCrop({ ...crop, scale: Number(e.target.value) }, aspect))
          }
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => onChange(DEFAULT_CROP)}
          className="text-xs text-blue-600 hover:underline"
        >
          Reset
        </button>
      </div>
      <span className="text-xs text-muted">Drag the image to reposition it inside the square.</span>
    </div>
  );
}
