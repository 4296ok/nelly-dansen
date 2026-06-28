# Artist Portfolio

A simple, image-first portfolio site with a private admin area where the artist
can upload and manage her own work — no coding required to add pieces.

- **Public site** — gallery (`/`), individual artwork pages, and an `/about` page.
- **Admin** — password-protected `/admin` page to upload, preview, and delete work.
- **Stack** — Next.js (App Router) + TypeScript + Tailwind CSS.

Everything is **free**: develop locally for nothing, and host for free on Vercel +
Supabase when you go live.

---

## Run it locally

```bash
npm install      # first time only
npm run dev
```

Open <http://localhost:3000>. The admin area is at <http://localhost:3000/admin>.

**Admin password:** set in `.env.local` (defaults to `changeme`):

```
ADMIN_PASSWORD=pick-a-good-password
```

### Personalise the site

Edit `lib/site.ts` — your name, tagline, About text, email, and social links all
live there. Just change the text between the quotes.

---

## How it stores work (local)

While developing on your computer:

- Uploaded images are saved to `public/uploads/`
- Titles/descriptions are saved to `data/artworks.json`

Both are git-ignored, so your test uploads won't be committed.

---

## Going live (free) — Supabase + Vercel

The local file-based storage above works great on your machine, but Vercel's
servers have a **read-only** filesystem, so for the live site you store images and
data in **Supabase** (free tier: a real database + 1 GB image storage + login).

The whole app only touches storage through `lib/store.ts` and `lib/auth.ts`, so
this swap stays contained to those two files.

### 1. Create free accounts
- **Supabase** — <https://supabase.com> → New project (free tier).
- **Vercel** — <https://vercel.com> → sign in with GitHub.

### 2. In Supabase
- Create a **Storage bucket** called `artworks` and mark it **public**.
- Create a **table** `artworks` with columns matching `lib/types.ts`
  (`id`, `title`, `description`, `medium`, `year`, `image`, `order`, `created_at`).
- Copy your **Project URL** and **anon/service keys** from Project Settings → API.

### 3. Wire it up
- `npm install @supabase/supabase-js`
- Replace the function bodies in `lib/store.ts` to read/write the Supabase table
  and upload files to the `artworks` bucket (returning the public URL as `image`).
- Add the Supabase keys as **Environment Variables** in Vercel.

### 4. Deploy
- Push this folder to a GitHub repo.
- In Vercel: **New Project → import the repo → Deploy.**
- Add `ADMIN_PASSWORD` and the Supabase env vars in Vercel's project settings.

That's it — the live site updates instantly whenever she adds a piece from `/admin`.

> Tip: when you're ready for the Supabase swap, just ask Claude Code to
> "switch the store to Supabase" and it can do the `lib/store.ts` changes for you.
