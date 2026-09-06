"use client";

import { useEffect, useState } from "react";
import { Card, Button, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatBytes, formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";

export function MediaClient() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/media", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setMedia(d.media); else setError("Could not load media.");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function upload(files: FileList | null) {
    if (!files || !files.length) return;
    const fd = new FormData();
    for (const f of Array.from(files)) fd.append("files", f);
    setUploading(true);
    const r = await fetch("/api/admin/media", { method: "POST", body: fd });
    const d = await r.json();
    setUploading(false);
    if (!d.ok) { toast("Upload failed.", "error"); return; }
    toast("Uploaded.");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
    toast("Deleted.");
    load();
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title="Couldn't load media" body={error} retry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Media Library</h1>
          <p className="text-sm text-admin-muted">Uploaded images &amp; files. Private files are served via authorized routes only.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-lg bg-gold-600 px-4 py-2 text-sm text-white disabled:opacity-50">
          {uploading ? "Uploading…" : "+ Upload"}
          <input type="file" className="hidden" multiple accept=".png,.jpg,.jpeg,.webp,.svg,.gif,.pdf,.epub" onChange={(e) => upload(e.target.files)} />
        </label>
      </div>
      <Card>
        {media.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {media.map((m) => (
              <div key={m.id} className="group relative rounded-xl border border-admin-border p-3">
                {m.kind === "image" ? (
                  // Private media served through an authorized route; next/image
                  // cannot proxy it, so a plain <img> is intentional here.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/media/${m.filename}`} alt={m.alt || m.originalName} className="h-28 w-full rounded-lg object-cover bg-gray-100" />
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-lg bg-gray-100 text-2xl text-admin-muted">{m.kind === "pdf" ? "📄" : "📕"}</div>
                )}
                <p className="mt-2 truncate text-xs text-admin-ink" title={m.originalName}>{m.originalName}</p>
                <p className="text-xs text-admin-muted">{formatBytes(m.size)} · {formatDateTime(m.createdAt)}</p>
                <button onClick={() => remove(m.id)} className="absolute right-2 top-2 hidden rounded-lg bg-red-500 px-2 py-1 text-xs text-white group-hover:block">Delete</button>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-admin-muted">No media yet. Upload an image or your eBook file above.</p>}
      </Card>
    </div>
  );
}
