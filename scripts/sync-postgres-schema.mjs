#!/usr/bin/env node
/**
 * Keeps `prisma/schema.postgresql.prisma` in lock-step with the canonical
 * `prisma/schema.prisma` (which uses SQLite for zero-config local dev).
 *
 * The two files are byte-identical except for the datasource `provider` line,
 * because the schema is written to be portable (JSON as text, statuses as
 * strings — no native SQLite-only types). This script copies the SQLite schema
 * and flips the provider to `postgresql` so you can never drift them apart.
 *
 * After editing `prisma/schema.prisma`, run: `npm run db:sync-postgres`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "prisma");
const source = resolve(dir, "schema.prisma");
const target = resolve(dir, "schema.postgresql.prisma");

let contents = readFileSync(source, "utf8");
contents = contents.replace(/provider = "sqlite"/, 'provider = "postgresql"');

writeFileSync(target, contents);
console.log(`Synced -> ${target} (provider=postgresql)`);
