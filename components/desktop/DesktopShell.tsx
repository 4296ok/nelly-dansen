"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Window from "./Window";
import SiteHeader, { type HeaderAction } from "@/components/SiteHeader";
import {
  DocsTitleBar,
  DocsBody,
  NotesTitleBar,
  NotesBody,
  PhoneNotch,
  PhoneBody,
} from "./windows";
import { site } from "@/lib/site";
import type { IgFeed } from "@/lib/instagram";

type WinId = "cv" | "bio" | "contact";
type WinState = { open: boolean; x: number; y: number; z: number };

// Phone/contact window is hidden for now (waiting on the live Instagram feed).
// Flip to true to bring it back — all the code stays intact.
const SHOW_CONTACT = false;

const WIDTHS: Record<WinId, number> = { cv: 520, bio: 440, contact: 260 };
const HEIGHTS: Record<WinId, number> = { cv: 480, bio: 360, contact: 520 };

// Positions (+ default open state) for the floating windows.
const desktopLayout: Record<WinId, WinState> = {
  bio: { open: true, x: 40, y: 120, z: 1 },
  contact: { open: true, x: 250, y: 150, z: 3 },
  cv: { open: true, x: 340, y: 90, z: 4 },
};

const mobileLayout: Record<WinId, WinState> = {
  cv: { open: true, x: 10, y: 90, z: 4 },
  bio: { open: false, x: 14, y: 140, z: 1 },
  contact: { open: false, x: 22, y: 170, z: 3 },
};

function withOpen(
  layout: Record<WinId, WinState>,
  open: boolean,
): Record<WinId, WinState> {
  return {
    cv: { ...layout.cv, open },
    bio: { ...layout.bio, open },
    contact: { ...layout.contact, open },
  };
}

/**
 * The site's window manager: renders the shared header plus the draggable
 * CV / BIO / CONTACT windows over whatever page content is passed as children.
 * Used on both the home page and the /work page so the windows pop up in place
 * on either one.
 *
 * `defaultOpen` controls whether the windows start open (home) or closed and
 * waiting for a header click (/work).
 */
export default function DesktopShell({
  instagram,
  defaultOpen = true,
  className,
  style,
  children,
}: {
  instagram?: IgFeed;
  defaultOpen?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const [wins, setWins] = useState<Record<WinId, WinState>>(() =>
    defaultOpen ? desktopLayout : withOpen(desktopLayout, false),
  );
  const [noteIndex, setNoteIndex] = useState(0);
  const zCounter = useRef(10);

  // Notes the header buttons jump to, found by title (robust to reordering).
  const contactNote = site.notes.findIndex(
    (n) => n.title.toLowerCase() === "contact",
  );
  const bioNote = site.notes.findIndex((n) =>
    n.title.toLowerCase().includes("artist statement"),
  );

  const focus = (id: WinId) =>
    setWins((w) => ({ ...w, [id]: { ...w[id], z: ++zCounter.current } }));

  const move = (id: WinId, x: number, y: number) =>
    setWins((w) => ({ ...w, [id]: { ...w[id], x, y } }));

  const open = (id: WinId) =>
    setWins((w) => ({ ...w, [id]: { ...w[id], open: true, z: ++zCounter.current } }));

  const close = (id: WinId) =>
    setWins((w) => ({ ...w, [id]: { ...w[id], open: false } }));

  // Open a window. Opening the Notes (bio) window resets it to the Artist
  // Statement so BIO always lands there.
  const openWin = (id: WinId) => {
    if (id === "bio") setNoteIndex(bioNote >= 0 ? bioNote : 0);
    open(id);
  };

  // Open the Notes window and jump to the Contact note.
  const openContact = () => {
    setNoteIndex(contactNote >= 0 ? contactNote : 0);
    open("bio");
  };

  // Header nav: CONTACT lives inside the Notes window; CV/BIO are their own.
  const onHeaderOpen = (id: HeaderAction) =>
    id === "contact" ? openContact() : openWin(id);

  // On small screens, switch to a stacked layout after mount (avoids hydration mismatch).
  useEffect(() => {
    if (window.innerWidth < 760) {
      setWins(defaultOpen ? mobileLayout : withOpen(mobileLayout, false));
    }
  }, [defaultOpen]);

  return (
    <div className={`relative min-h-[100svh] w-full ${className ?? ""}`} style={style}>
      <SiteHeader onOpen={onHeaderOpen} />

      {children}

      {/* Windows float over the page content (and scroll) in a fixed overlay.
          The overlay ignores pointer events so the page stays clickable; each
          window re-enables them for itself. */}
      <div className="pointer-events-none fixed inset-0 z-[70]">
        {wins.cv.open && (
          <Window
            {...wins.cv}
            width={WIDTHS.cv}
            height={HEIGHTS.cv}
            onFocus={() => focus("cv")}
            onMove={(x, y) => move("cv", x, y)}
            className="pointer-events-auto rounded-lg"
            handle={<DocsTitleBar onClose={() => close("cv")} />}
          >
            <DocsBody />
          </Window>
        )}

        {wins.bio.open && (
          <Window
            {...wins.bio}
            width={WIDTHS.bio}
            height={HEIGHTS.bio}
            onFocus={() => focus("bio")}
            onMove={(x, y) => move("bio", x, y)}
            className="pointer-events-auto rounded-lg"
            handle={<NotesTitleBar onClose={() => close("bio")} />}
          >
            <NotesBody selected={noteIndex} onSelect={setNoteIndex} />
          </Window>
        )}

        {SHOW_CONTACT && instagram && wins.contact.open && (
          <Window
            {...wins.contact}
            width={WIDTHS.contact}
            height={HEIGHTS.contact}
            onFocus={() => focus("contact")}
            onMove={(x, y) => move("contact", x, y)}
            className="pointer-events-auto rounded-[2rem] border-[6px] border-black bg-black"
            handle={<PhoneNotch />}
          >
            <PhoneBody instagram={instagram} />
          </Window>
        )}
      </div>
    </div>
  );
}
