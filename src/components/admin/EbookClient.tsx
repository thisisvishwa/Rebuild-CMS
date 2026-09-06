"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Field, Input, Textarea, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatBytes, formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";
import { usePermission } from "@/components/admin/PermissionProvider";

export function EbookClient() {
  const { can } = usePermission();
  const [versions, setVersions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploader, setUploader] = useState(false);

  async function load() {
    setLoading(true);
    const [va, pa] = await Promise.all([
      fetch("/api/admin/ebook/versions", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/products", { cache: "no-store" }).then((r) => r.json()),
    ]);
    if (va.ok) setVersions(va.versions);
    if (pa.ok) setProducts(pa.products);
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title="Couldn't load eBooks" body={error} retry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">eBook Management</h1>
          <p className="text-sm text-admin-muted">Upload versions, activate a live version, or archive old ones.</p>
        </div>
        {can("ebook:manage") && <Button onClick={() => setUploader(true)}>+ Upload version</Button>}
      </div>

      <Card title="Versions">
        {versions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-admin-border text-left text-xs uppercase text-admin-muted">
                <th className="px-3 py-2">Product</th><th className="px-3 py-2">Version</th><th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Entitlements</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Uploaded</th><th className="px-3 py-2"></th>
              </tr></thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id} className="border-b border-admin-border last:border-0">
                    <td className="px-3 py-2">{v.product.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">v{v.version}</td>
                    <td className="px-3 py-2">{formatBytes(v.fileSize)}</td>
                    <td className="px-3 py-2">{v.entitlements.length}</td>
                    <td className="px-3 py-2"><StatusPill status={v.status} /></td>
                    <td className="px-3 py-2 text-admin-muted">{formatDateTime(v.uploadedAt)}</td>
                    <td className="px-3 py-2">
                      {can("ebook:manage") && v.status !== "active" &&
                        <Button variant="outline" onClick={() => setStatus(v.id, "activate")}>Activate</Button>}
                      {can("ebook:manage") && v.status === "active" &&
                        <Button variant="ghost" onClick={() => setStatus(v.id, "archive")}>Archive</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-admin-muted">No versions uploaded yet.</p>}
      </Card>

      {uploader && (
        <UploadModal
          products={products}
          onClose={() => setUploader(false)}
          onCb={() => { setUploader(false); load(); }}
        />
      )}
    </div>
  );
}

async function setStatus(id: string, action: string) {
  await fetch(`/api/admin/ebook/versions/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
}

function UploadModal({ products, onClose, onCb }: { products: any[]; onClose: () => void; onCb: () => void }) {
  const { toast } = useToast();
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [version, setVersion] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast("Choose a PDF/EPUB file.", "error"); return; }
    const fd = new FormData();
    fd.set("productId", productId); fd.set("version", version); fd.set("releaseNotes", releaseNotes); fd.set("file", file);
    setBusy(true);
    const r = await fetch("/api/admin/ebook/versions", { method: "POST", body: fd });
    const d = await r.json();
    setBusy(false);
    if (!d.ok) { toast(d.error || "Could not upload.", "error"); return; }
    toast("Version uploaded.");
    onCb();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-admin-border bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-admin-ink">Upload version</h2>
          <button type="button" onClick={onClose} className="text-admin-muted hover:text-admin-ink">✕</button>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="Product"><select className="w-full rounded-lg border border-admin-border px-3 py-2 text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Version number"><Input required value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0" /></Field>
          <Field label="Release notes"><Textarea rows={3} value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)} /></Field>
          <Field label="File (PDF/EPUB)" hint="Max 50MB, private."><input type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" className="block w-full text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Uploading…" : "Upload"}</Button></div>
      </form>
    </div>
  );
}
