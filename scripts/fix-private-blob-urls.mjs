#!/usr/bin/env node
// One-time repair for a bug where the shared /api/upload route created every
// file (photos, floorplans, specs, takeoffs, renderings, task attachments,
// contractor profile docs) with `access: "private"` on Vercel Blob instead of
// "public". That's been fixed in app/api/upload/route.ts going forward, but
// files uploaded BEFORE that fix still point at private blob URLs, which
// return "Forbidden" when the app loads them directly (this app has no
// authenticated blob-serving route - it just does <img src> / <a href>
// straight to the blob URL, which only works for public blobs).
//
// This script scans every text/varchar column in the database for values
// containing ".private.blob.vercel-storage.com", downloads each one (using
// BLOB_READ_WRITE_TOKEN, which is allowed to read private blobs), re-uploads
// it as a public blob, and updates the row to point at the new public URL.
// The old private blob is left alone (harmless - just unused storage) unless
// you pass --delete-old.
//
// This must run somewhere with real network access to your database and
// Vercel Blob - NOT in the Cowork sandbox. Run it locally:
//
//   vercel env pull .env.local
//   node --env-file=.env.local scripts/fix-private-blob-urls.mjs --dry-run
//   node --env-file=.env.local scripts/fix-private-blob-urls.mjs
//
// Review the dry-run output first. Nothing is written to the database or
// Blob storage until you drop --dry-run.

import { PrismaClient } from "@prisma/client";
import { put, del } from "@vercel/blob";

const DRY_RUN = process.argv.includes("--dry-run");
const DELETE_OLD = process.argv.includes("--delete-old");
const NEEDLE = ".private.blob.vercel-storage.com";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set. Run `vercel env pull .env.local` first, then re-run with --env-file=.env.local.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Run `vercel env pull .env.local` first, then re-run with --env-file=.env.local.");
    process.exit(1);
  }

  const columns = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type IN ('text', 'character varying')
    ORDER BY table_name, column_name
  `);

  let totalFixed = 0;
  let totalFailed = 0;

  for (const { table_name, column_name } of columns) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, "${column_name}" AS val FROM "${table_name}" WHERE "${column_name}" LIKE $1`,
      `%${NEEDLE}%`
    );

    if (rows.length === 0) continue;

    console.log(`\n${table_name}.${column_name}: ${rows.length} row(s) with a private blob URL`);

    for (const row of rows) {
      const oldUrl = row.val;
      try {
        const res = await fetch(oldUrl, {
          headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        });
        if (!res.ok) throw new Error(`Fetch of old blob failed: HTTP ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get("content-type") || undefined;
        const pathname = decodeURIComponent(new URL(oldUrl).pathname.replace(/^\//, ""));

        console.log(`  ${row.id}: ${oldUrl}`);

        if (DRY_RUN) {
          console.log(`    (dry run) would re-upload ${buffer.length} bytes as public and update the row`);
          continue;
        }

        const blob = await put(pathname, buffer, {
          access: "public",
          addRandomSuffix: true,
          contentType,
        });

        await prisma.$executeRawUnsafe(
          `UPDATE "${table_name}" SET "${column_name}" = $1 WHERE id = $2`,
          blob.url,
          row.id
        );

        if (DELETE_OLD) {
          await del(oldUrl).catch((e) => console.warn(`    could not delete old blob: ${e.message}`));
        }

        console.log(`    -> ${blob.url}`);
        totalFixed++;
      } catch (err) {
        console.error(`    FAILED (${row.id}): ${err.message}`);
        totalFailed++;
      }
    }
  }

  console.log(`\nDone. Fixed ${totalFixed}, failed ${totalFailed}.${DRY_RUN ? " (dry run - nothing written)" : ""}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
