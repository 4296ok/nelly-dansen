"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Artwork } from "@/lib/types";

const INPUT =
  "rounded-md border border-line bg-transparent px-3 py-2 outline-none focus:border-foreground";

/**
 * Accumulating image picker. Keeps picked files in state (not in the file
 * input) so the artist can click "Choose images" several times — even across
 * different folders — and have every selection add up.
 */
function usePickedImages() {
  const [picked, setPicked] = useState<{ file: File; url: string }[]>([]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setPicked((prev) => {
      const next = [...prev];
      for (const file of Array.from(list)) {
        const dup = next.some(
          (p) => p.file.name === file.name && p.file.size === file.size,
        );
        if (!dup) next.push({ file, url: URL.createObjectURL(file) });
      }
      return next;
    });
  }

  function removeFile(index: number) {
    setPicked((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function clearFiles() {
    setPicked((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
  }

  return { picked, addFiles, removeFile, clearFiles };
}

type Picker = ReturnType<typeof usePickedImages>;

/** File input + thumbnails for the accumulating picker. */
function NewImagesField({
  picker,
  hint,
  coverBadge = false,
}: {
  picker: Picker;
  hint: string;
  coverBadge?: boolean;
}) {
  const { picked, addFiles, removeFile, clearFiles } = picker;
  return (
    <>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          addFiles(e.target.files);
          // Reset so picking the same file (or folder) again still fires.
          e.target.value = "";
        }}
        className="text-sm file:mr-4 file:rounded-md file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-background"
      />
      <span className="text-xs text-muted">{hint}</span>
      {picked.length > 0 && (
        <div className="mt-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">
              {picked.length} new image{picked.length > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={clearFiles}
              className="text-sm text-red-600 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {picked.map((p, i) => (
              <div key={p.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={`Selected ${i + 1}`}
                  className="h-24 w-24 rounded-md border border-line object-cover"
                />
                {coverBadge && i === 0 && (
                  <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[10px] font-medium text-white">
                    cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label="Remove image"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs leading-none text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminDashboard({ initial }: { initial: Artwork[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Artwork[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const picker = usePickedImages();

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (picker.picked.length === 0) {
      setError("Please choose at least one image first.");
      return;
    }
    const form = e.currentTarget;
    // Text fields come from the form; the images come from our accumulated state.
    const data = new FormData(form);
    data.delete("files");
    picker.picked.forEach((p) => data.append("files", p.file));

    setBusy(true);
    const res = await fetch("/api/artworks", { method: "POST", body: data });
    setBusy(false);
    if (res.ok) {
      const created: Artwork = await res.json();
      setItems((prev) => [created, ...prev]);
      form.reset();
      picker.clearFiles();
    } else {
      const { error } = await res.json().catch(() => ({ error: "Upload failed" }));
      setError(error ?? "Upload failed");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this project? This can't be undone.")) return;
    const res = await fetch(`/api/artworks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function onLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Manage work</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-muted hover:text-foreground">
            View site
          </Link>
          <button onClick={onLogout} className="text-muted hover:text-foreground">
            Sign out
          </button>
        </div>
      </div>

      {/* Upload form */}
      <form onSubmit={onUpload} className="mt-8 rounded-lg border border-line p-5">
        <h2 className="font-medium">Add a new project</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 flex flex-col gap-2">
            <span className="text-sm text-muted">Images</span>
            <NewImagesField
              picker={picker}
              coverBadge
              hint="Click as many times as you like — selections add up, including from different folders. The first image is the cover."
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted">Title</span>
            <input name="title" placeholder="Untitled" className={INPUT} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted">Year</span>
            <input name="year" placeholder="2026" className={INPUT} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted">Medium(s)</span>
            <input
              name="medium"
              placeholder="Oil on canvas, video, sound"
              className={INPUT}
            />
          </label>
          <label className="sm:col-span-2 flex flex-col gap-2">
            <span className="text-sm text-muted">Description</span>
            <textarea
              name="description"
              rows={3}
              placeholder="A few words about this project…"
              className={INPUT}
            />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 rounded-md bg-foreground px-5 py-2.5 font-medium text-background disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Add project"}
        </button>
      </form>

      {/* Existing work */}
      <h2 className="mt-12 font-medium">
        Your work <span className="text-muted">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-muted">Nothing yet — add your first project above.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {items.map((art) =>
            editingId === art.id ? (
              <li key={art.id} className="py-4">
                <EditRow
                  item={art}
                  onCancel={() => setEditingId(null)}
                  onSaved={(updated) => {
                    setItems((prev) =>
                      prev.map((a) => (a.id === updated.id ? updated : a)),
                    );
                    setEditingId(null);
                  }}
                />
              </li>
            ) : (
              <li key={art.id} className="flex items-center gap-4 py-4">
                <div className="relative h-16 w-16 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={art.images[0]}
                    alt={art.title}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                  {art.images.length > 1 && (
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[10px] font-medium text-white">
                      {art.images.length}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{art.title}</p>
                  <p className="truncate text-sm text-muted">
                    {[art.medium, art.year].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingId(art.id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(art.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </main>
  );
}

/** Inline editor for one existing project. */
function EditRow({
  item,
  onSaved,
  onCancel,
}: {
  item: Artwork;
  onSaved: (a: Artwork) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [year, setYear] = useState(item.year);
  const [medium, setMedium] = useState(item.medium);
  const [description, setDescription] = useState(item.description);
  // Existing images we're keeping (toggle off to remove).
  const [keep, setKeep] = useState<string[]>(item.images);
  const picker = usePickedImages();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggleKeep = (img: string) =>
    setKeep((prev) =>
      prev.includes(img) ? prev.filter((x) => x !== img) : [...prev, img],
    );

  // The cover is the first kept existing image.
  const cover = item.images.find((img) => keep.includes(img));

  async function onSave() {
    setError("");
    if (keep.length === 0 && picker.picked.length === 0) {
      setError("A project needs at least one image.");
      return;
    }
    const removeImages = item.images.filter((img) => !keep.includes(img));
    const data = new FormData();
    data.set("title", title);
    data.set("year", year);
    data.set("medium", medium);
    data.set("description", description);
    removeImages.forEach((img) => data.append("removeImages", img));
    picker.picked.forEach((p) => data.append("files", p.file));

    setBusy(true);
    const res = await fetch(`/api/artworks/${item.id}`, {
      method: "PATCH",
      body: data,
    });
    setBusy(false);
    if (res.ok) {
      picker.clearFiles();
      onSaved(await res.json());
    } else {
      const { error } = await res.json().catch(() => ({ error: "Save failed" }));
      setError(error ?? "Save failed");
    }
  }

  return (
    <div className="rounded-lg border border-line p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <span className="text-sm text-muted">
            Current images — click one to remove it
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.images.map((img) => {
              const kept = keep.includes(img);
              return (
                <button
                  type="button"
                  key={img}
                  onClick={() => toggleKeep(img)}
                  className={`relative h-20 w-20 overflow-hidden rounded-md border ${
                    kept ? "border-line" : "border-red-500 opacity-40"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  {kept && img === cover && (
                    <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[10px] font-medium text-white">
                      cover
                    </span>
                  )}
                  {!kept && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-red-600">
                      removed
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <label className="sm:col-span-2 flex flex-col gap-2">
          <span className="text-sm text-muted">Add more images</span>
          <NewImagesField
            picker={picker}
            hint="New images are appended to this project."
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">Title</span>
          <input
            className={INPUT}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">Year</span>
          <input
            className={INPUT}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">Medium(s)</span>
          <input
            className={INPUT}
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
          />
        </label>
        <label className="sm:col-span-2 flex flex-col gap-2">
          <span className="text-sm text-muted">Description</span>
          <textarea
            rows={3}
            className={INPUT}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="rounded-md bg-foreground px-5 py-2.5 font-medium text-background disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-line px-5 py-2.5 font-medium hover:border-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
