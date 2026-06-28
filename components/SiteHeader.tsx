"use client";

import Link from "next/link";
import { site } from "@/lib/site";

export type HeaderAction = "cv" | "bio" | "contact";

const ITEM = "bevel-emboss text-[#0000ff] transition-opacity hover:opacity-70";

/**
 * The site's top bar. Identical on every page. The title is the home button.
 *
 * The CV / BIO / CONTACT items open draggable windows that live on the home
 * page. When `onOpen` is provided (i.e. we're on the home page) they open in
 * place; otherwise they link home with `?open=<id>` so the window opens on
 * arrival. WORK is always a link to the /work page.
 */
export default function SiteHeader({
  onOpen,
}: {
  onOpen?: (id: HeaderAction) => void;
}) {
  const navBtn = (id: HeaderAction, label: string) =>
    onOpen ? (
      <button key={id} onClick={() => onOpen(id)} className={ITEM}>
        {label}
      </button>
    ) : (
      <Link key={id} href={`/?open=${id}`} className={ITEM}>
        {label}
      </Link>
    );

  return (
    <header className="sticky top-0 z-[60] flex flex-wrap items-center gap-x-4 gap-y-1 bg-gradient-to-r from-[#ff0000] to-white px-4 py-3 text-xl font-black uppercase tracking-tight sm:text-2xl">
      <Link
        href="/"
        className="bevel-emboss text-black transition-opacity hover:opacity-70"
      >
        {site.title}
      </Link>
      <nav className="flex gap-4">
        {navBtn("cv", "CV")}
        {navBtn("bio", "BIO")}
        <Link href="/work" className={ITEM}>
          WORK
        </Link>
        {navBtn("contact", "CONTACT")}
      </nav>
    </header>
  );
}
