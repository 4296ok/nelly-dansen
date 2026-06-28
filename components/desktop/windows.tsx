"use client";

import { TrafficLights } from "./Window";
import { site } from "@/lib/site";
import type { IgFeed } from "@/lib/instagram";

/* ----------------------------- CV: Google Docs ---------------------------- */

export function DocsTitleBar({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-t-lg bg-[#f1f3f4] px-3 py-2">
      <TrafficLights onClose={onClose} />
      <div className="mx-auto flex max-w-[60%] flex-1 items-center gap-2 truncate rounded-full bg-white px-3 py-1 text-xs text-zinc-500 shadow-inner">
        <span>🔒</span>
        <span className="truncate">docs.google.com/document/d/CV</span>
      </div>
    </div>
  );
}

export function DocsBody() {
  const { cv } = site;
  return (
    <div className="flex h-full flex-col rounded-b-lg bg-white text-zinc-900">
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200 px-4 py-1.5 text-zinc-400">
        <span className="text-sm font-medium text-blue-600">Docs</span>
        <span className="text-xs">File Edit View Insert Format</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-8 py-6 text-[13px] leading-relaxed">
        <h2 className="text-base font-bold">CV {cv.name}</h2>
        <div className="mt-1 font-semibold">
          {cv.lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
        {cv.sections.map((sec) => (
          <div key={sec.heading} className="mt-5">
            <p className="font-bold">{sec.heading}</p>
            <div className="mt-1 space-y-0.5">
              {sec.items.map((item, i) => (
                <p key={i}>{item}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- BIO: Notes app ------------------------------ */

export function NotesTitleBar({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-t-lg bg-[#2a2a2a] px-3 py-2 text-zinc-400">
      <TrafficLights onClose={onClose} />
      <div className="ml-auto flex items-center gap-3 text-sm">
        <span title="List">▤</span>
        <span title="Grid">▦</span>
        <span title="Delete">🗑</span>
        <span title="New note">✎</span>
      </div>
    </div>
  );
}

export function NotesBody({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (i: number) => void;
}) {
  const note = site.notes[selected];
  return (
    <div className="flex h-full rounded-b-lg bg-[#1c1c1e] text-zinc-200">
      <aside className="w-40 shrink-0 overflow-auto border-r border-white/10 bg-[#262626] p-2">
        <p className="px-2 pb-2 text-[11px] uppercase tracking-wide text-zinc-500">
          Notes
        </p>
        {site.notes.map((n, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`mb-1 w-full rounded-md px-2 py-2 text-left ${
              i === selected ? "bg-yellow-500/20" : "hover:bg-white/5"
            }`}
          >
            <p className="truncate text-[13px] font-semibold">{n.title}</p>
            <p className="truncate text-[11px] text-zinc-500">
              {n.time} · {n.body}
            </p>
          </button>
        ))}
      </aside>
      <article className="flex-1 overflow-auto p-5">
        <p className="text-center text-[11px] text-zinc-500">{note.time}</p>
        <h3 className="mt-2 text-lg font-bold">{note.title}</h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {note.body}
        </p>
      </article>
    </div>
  );
}

/* --------------------------- CONTACT: Instagram --------------------------- */

export function PhoneNotch() {
  return (
    <div className="flex h-7 items-center justify-center rounded-t-[2rem] bg-black">
      <div className="h-4 w-20 rounded-full bg-zinc-800" />
    </div>
  );
}

export function PhoneBody({ instagram }: { instagram: IgFeed }) {
  const c = site.contact;
  const profileUrl = `https://www.instagram.com/${c.handle}/`;
  const posts = instagram.posts;
  const postCount = posts.length ? `${posts.length}+` : c.posts;

  return (
    <div className="h-full overflow-auto rounded-b-[2rem] bg-white px-4 pb-5 text-zinc-900">
      <div className="flex items-center justify-between py-3 text-sm font-semibold">
        <span>{c.handle}</span>
        <span className="text-lg leading-none">⋯</span>
      </div>
      <div className="flex items-center gap-5">
        <a href={profileUrl} target="_blank" rel="noopener noreferrer">
          {instagram.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={instagram.avatar}
              alt={`${c.handle} profile picture`}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-orange-400" />
          )}
        </a>
        <div className="flex flex-1 justify-around text-center text-sm">
          <div>
            <p className="font-bold">{postCount}</p>
            <p className="text-zinc-500">posts</p>
          </div>
          <div>
            <p className="font-bold">{c.followers}</p>
            <p className="text-zinc-500">followers</p>
          </div>
          <div>
            <p className="font-bold">{c.following}</p>
            <p className="text-zinc-500">following</p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm">
        <span className="font-semibold">@{c.handle}</span>
        <br />
        {c.bio}
      </p>
      <div className="mt-3 flex gap-2">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-md bg-blue-500 py-1.5 text-center text-sm font-medium text-white"
        >
          Follow
        </a>
        <a
          href={`mailto:${c.email}`}
          className="flex-1 rounded-md bg-zinc-100 py-1.5 text-center text-sm font-medium text-zinc-900"
        >
          Message
        </a>
      </div>
      {posts.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-0.5">
          {posts.map((p) => (
            <a
              key={p.id}
              href={p.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square overflow-hidden bg-zinc-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt={p.caption ?? "Instagram post"}
                loading="lazy"
                className="h-full w-full object-cover transition-opacity hover:opacity-80"
              />
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gradient-to-br from-zinc-200 to-zinc-400"
              style={{ filter: `hue-rotate(${i * 40}deg)` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
