import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

/**
 * Private file storage for media + eBook files (§18, §68).
 *
 * Files are stored OUTSIDE the public `public/` dir so they are never directly
 * web-accessible and can only be served through the signed/authorized download
 * routes.
 *
 * Two drivers are supported, selected at runtime:
 *   - "local"  (default)  → writes under `storage/private` on the server disk.
 *                           Good for local dev / self-hosted VMs. NOT durable on
 *                           serverless (Vercel) where the function filesystem is
 *                           read-only and ephemeral.
 *   - "vercel"            → uses Vercel Blob (`@vercel/blob`) so files persist in
 *                           serverless. Set STORAGE_DRIVER=vercel and provide
 *                           BLOB_READ_WRITE_TOKEN (or use `vercel blob` CLI).
 *
 * The Media.path / url fields and the signed-access contract stay the same
 * regardless of driver, so routes don't change.
 */

type Driver = "local" | "vercel";

function driver(): Driver {
  if ((process.env.STORAGE_DRIVER ?? "local").toLowerCase() === "vercel") return "vercel";
  return "local";
}

export function storageDriver(): Driver {
  return driver();
}

export function isServerlessStorageConfigured(): boolean {
  return driver() === "vercel" && !!process.env.BLOB_READ_WRITE_TOKEN;
}

export interface StoredFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  hash: string;
  kind: "image" | "pdf" | "epub" | "other";
}

const KIND_BY_MIME: Record<string, "image" | "pdf" | "epub" | "other"> = {
  "image/png": "image", "image/jpeg": "image", "image/webp": "image",
  "image/svg+xml": "image", "image/gif": "image",
  "application/pdf": "pdf",
  "application/epub+zip": "epub",
};

// Allowed upload types — reject executables and anything dangerous.
const ALLOWED_MIME = new Set([
  "image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif",
  "application/pdf", "application/epub+zip",
]);
const ALLOWED_EXT = new Set([
  "png", "jpg", "jpeg", "webp", "svg", "gif", "pdf", "epub",
]);

function safeFilename(original: string): string {
  const base = original.replace(/[^\w.\-]/g, "_").slice(-80);
  return base || "file";
}

function mimeFromExtension(ext: string): string {
  const map: Record<string, string> = {
    pdf: "application/pdf", epub: "application/epub+zip", png: "image/png",
    jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
    svg: "image/svg+xml", gif: "image/gif",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * Persist a file and record a Media row. Returns a StoredFile descriptor.
 */
export async function storePrivateFile(
  file: File,
  opts: { alt?: string; isPrivate?: boolean } = {},
): Promise<{ media: { id: string; url: string }; file: StoredFile }> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("File type not allowed.");
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error("File extension not allowed.");
  }
  if (file.size > 50 * 1024 * 1024) {
    throw new Error("File too large (max 50MB).");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash("sha256").update(buf).digest("hex");
  const safe = safeFilename(file.name);
  const storedName = `${crypto.randomBytes(6).toString("hex")}-${safe}`;
  const kind = KIND_BY_MIME[file.type] ?? "other";

  let storedPath: string;
  let mediaUrl = `/api/media/${storedName}`;

  const isVercel = driver() === "vercel";
  if (isVercel && process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`private/${storedName}`, buf, {
      access: "private",
      addRandomSuffix: false,
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    storedPath = blob.url; // durable object URL
  } else {
    if (isVercel) {
      // Requested Vercel storage but no token — fail loudly, don't silently drop.
      throw new Error(
        "Vercel Blob storage requested but BLOB_READ_WRITE_TOKEN is not set. " +
        "Set it (or STORAGE_DRIVER=local) in your environment.",
      );
    }
    const fs = await import("node:fs/promises");
    const path = require("node:path") as typeof import("node:path");
    const dir = "storage/private";
    await fs.mkdir(path.resolve(process.cwd(), dir), { recursive: true });
    storedPath = `${dir}/${storedName}`;
    await fs.writeFile(path.resolve(process.cwd(), storedPath), buf);
  }

  const media = await prisma.media.create({
    data: {
      filename: storedName,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: storedPath,
      url: mediaUrl,
      alt: opts.alt ?? null,
      kind,
      isPrivate: opts.isPrivate ?? true,
      width: kind === "image" ? null : null,
      height: null,
    },
  });

  return {
    media: { id: media.id, url: mediaUrl },
    file: {
      filename: storedName,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: storedPath,
      url: mediaUrl,
      hash,
      kind,
    },
  };
}

/** Resolve a Media row back into its bytes (used by /api/media/:name). */
export async function readPrivateFile(storedPath: string) {
  const ext = storedPath.split(".").pop()?.toLowerCase() ?? "";
  const contentType = mimeFromExtension(ext);
  const basename = storedPath.split("/").pop() ?? "file";

  if (driver() === "vercel") {
    const { get } = await import("@vercel/blob");
    const result = await get(storedPath, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || !result.stream) throw new Error("File unavailable");
    const reader = result.stream.getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const buf = Buffer.concat(chunks);
    return { buf, contentType, basename };
  }

  const fs = await import("node:fs/promises");
  const path = require("node:path") as typeof import("node:path");
  const full = path.resolve(process.cwd(), storedPath);
  const buf = await fs.readFile(full);
  return { buf, contentType, basename };
}

/** Delete a stored file by its media path (best-effort). */
export async function deletePrivateFile(storedPath: string): Promise<void> {
  try {
    if (driver() === "vercel") {
      const { del } = await import("@vercel/blob");
      await del(storedPath, { token: process.env.BLOB_READ_WRITE_TOKEN });
      return;
    }
    const fs = await import("node:fs/promises");
    const path = require("node:path") as typeof import("node:path");
    await fs.unlink(path.resolve(process.cwd(), storedPath));
  } catch {
    /* best-effort */
  }
}

/** Whether the current FS can persist uploads (local driver = any host disk). */
export function isPersistentStorage(): boolean {
  const d = driver();
  if (d === "vercel") return !!process.env.BLOB_READ_WRITE_TOKEN;
  // local disk persists on self-hosted VMs; on Vercel it does not.
  return !process.env.VERCEL;
}
