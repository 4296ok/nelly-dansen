#!/usr/bin/env node
/**
 * One-off migration: reads the local data/artworks.json + public/uploads/
 * files and pushes them into Supabase (storage bucket "artworks" + table
 * "artworks"). Run this once, from the project root, after:
 *
 *   1. Creating the bucket and table in Supabase (see the setup instructions
 *      you were given alongside this script).
 *   2. Adding SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.
 *   3. `npm install @supabase/supabase-js` (if not already installed).
 *
 * Then run:
 *
 *   node scripts/migrate-to-supabase.mjs
 *
 * It's safe to run more than once — it upserts by id, and re-uploading a
 * file that's already there just overwrites it with identical bytes.
 */

import { readFileSync } from "fs";
import { readFile as readFileAsync } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();

// Minimal .env.local reader so this one-off script doesn't need a `dotenv`
// dependency just for a migration you'll run once.
function loadEnvLocal() {
  let text;
  try {
    text = readFileSync(path.join(ROOT, ".env.local"), "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "artworks";
const TABLE = "artworks";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Add both to .env.local before running this script."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function extFromName(name) {
  const m = /\.[a-z0-9]+$/i.exec(name);
  return m ? m[0].toLowerCase() : "";
}

function contentTypeFor(ext) {
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".m4v": "video/x-m4v",
    ".ogg": "video/ogg",
    ".ogv": "video/ogg",
  };
  return map[ext] ?? "application/octet-stream";
}

async function main() {
  const dataFile = path.join(ROOT, "data", "artworks.json");
  const uploadDir = path.join(ROOT, "public", "uploads");

  const raw = await readFileAsync(dataFile, "utf8");
  const items = JSON.parse(raw);

  console.log(`Found ${items.length} project(s) in data/artworks.json.\n`);

  for (const item of items) {
    const images =
      item.images && item.images.length ? item.images : item.image ? [item.image] : [];

    console.log(`→ ${item.title || "(untitled)"} (${item.id}) — ${images.length} file(s)`);

    const uploadedUrls = [];
    for (const [i, localPath] of images.entries()) {
      // localPath looks like "/uploads/<filename>"
      const filename = localPath.replace(/^\/uploads\//, "");
      const fileBuffer = await readFileAsync(path.join(uploadDir, filename));
      const ext = extFromName(filename) || ".jpg";
      const bucketPath = `${item.id}/${i}${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(bucketPath, fileBuffer, {
          contentType: contentTypeFor(ext),
          upsert: true,
        });
      if (uploadError) {
        console.error(`  ✗ failed to upload ${filename}: ${uploadError.message}`);
        continue;
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(bucketPath);
      uploadedUrls.push(pub.publicUrl);
      console.log(`  ✓ uploaded ${filename}`);
    }

    const row = {
      id: item.id,
      title: item.title ?? "Untitled",
      description: item.description ?? "",
      medium: item.medium ?? "",
      year: item.year ?? "",
      category: item.category === "paparazzi" ? "paparazzi" : "work",
      images: uploadedUrls,
      fit: item.fit === "full" ? "full" : "square",
      crop: item.crop ?? null,
      order: typeof item.order === "number" ? item.order : 0,
      created_at: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
    };

    const { error: insertError } = await supabase.from(TABLE).upsert(row);
    if (insertError) {
      console.error(`  ✗ failed to save row: ${insertError.message}`);
    } else {
      console.log(`  ✓ saved to the artworks table\n`);
    }
  }

  console.log("Done. Check the Supabase Table Editor to confirm everything looks right,");
  console.log("then load /work and /paparazzi on your live site to see it end to end.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
