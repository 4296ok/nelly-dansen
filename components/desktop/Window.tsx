"use client";

import { useRef, useState, type ReactNode } from "react";

export function TrafficLights({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onClose}
        aria-label="Close"
        className="h-3 w-3 rounded-full bg-[#ff5f57] transition-transform hover:scale-110"
      />
      <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
      <span className="h-3 w-3 rounded-full bg-[#28c840]" />
    </div>
  );
}

const MIN_W = 240;
const MIN_H = 160;

export type WindowProps = {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  /** Draggable strip (title bar, phone notch, etc.) */
  handle: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function Window({
  x,
  y,
  z,
  width,
  height,
  onFocus,
  onMove,
  handle,
  children,
  className,
}: WindowProps) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const resize = useRef<{
    px: number;
    py: number;
    w: number;
    h: number;
  } | null>(null);
  const [size, setSize] = useState({ w: width, h: height });

  return (
    <div
      className={`absolute flex flex-col overflow-hidden shadow-2xl ${className ?? ""}`}
      style={{
        left: x,
        top: y,
        // Base 100 keeps every window above the header (z-60) while preserving
        // the relative stacking order between windows.
        zIndex: 100 + z,
        width: `min(${size.w}px, 92vw)`,
        height: `min(${size.h}px, 88svh)`,
      }}
      onPointerDown={onFocus}
    >
      <div
        className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={(e) => {
          onFocus();
          drag.current = { dx: e.clientX - x, dy: e.clientY - y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          onMove(
            Math.max(0, e.clientX - drag.current.dx),
            Math.max(0, e.clientY - drag.current.dy)
          );
        }}
        onPointerUp={(e) => {
          drag.current = null;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      >
        {handle}
      </div>

      <div className="min-h-0 flex-1">{children}</div>

      {/* Resize grip (bottom-right corner) */}
      <div
        aria-label="Resize"
        className="absolute bottom-0 right-0 z-10 h-4 w-4 cursor-se-resize touch-none"
        onPointerDown={(e) => {
          e.stopPropagation();
          onFocus();
          resize.current = { px: e.clientX, py: e.clientY, w: size.w, h: size.h };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!resize.current) return;
          const r = resize.current;
          setSize({
            w: Math.max(MIN_W, r.w + (e.clientX - r.px)),
            h: Math.max(MIN_H, r.h + (e.clientY - r.py)),
          });
        }}
        onPointerUp={(e) => {
          resize.current = null;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      >
        <span className="pointer-events-none absolute bottom-[3px] right-[3px] h-2 w-2 border-b-2 border-r-2 border-black/40" />
      </div>
    </div>
  );
}
