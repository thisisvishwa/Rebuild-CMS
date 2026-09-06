"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Input, Field, Textarea, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";
import { usePermission } from "@/components/admin/PermissionProvider";

export function ProductsClient() {
  const { can } = usePermission();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<any>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/products", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setProducts(d.products); else setError("Could not load products.");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title="Couldn't load products" body={error} retry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Products</h1>
          <p className="text-sm text-admin-muted">Catalog &amp; pricing (backend single source of truth).</p>
        </div>
        {can("products:manage") && <Button onClick={() => setEditor({})}>+ New product</Button>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {products.map((p) => (
          <Card key={p.id} action={can("products:manage") && <Button variant="outline" onClick={() => setEditor(p)}>Edit</Button>}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-semibold text-admin-ink">{p.name}</h3>
                <p className="mt-1 text-xs text-admin-muted">{p.slug}</p>
              </div>
              <StatusPill status={p.isActive ? "active" : "archived"} />
            </div>
            <p className="mt-3 text-sm text-admin-muted line-clamp-2">{p.description || "No description"}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-serif text-xl font-semibold text-admin-ink">{formatCurrency(p.priceMinor, p.currency)}</span>
              <span className="text-xs text-admin-muted">{p._count.orders} orders</span>
            </div>
            {p.versions[0] && <p className="mt-2 text-xs text-admin-muted">Latest version: {p.versions[0].version}</p>}
          </Card>
        ))}
      </div>

      {editor !== null && (
        <ProductEditor
          product={editor}
          onClose={() => setEditor(null)}
          onSaved={() => { setEditor(null); load(); }}
        />
      )}
    </div>
  );
}

function ProductEditor({ product, onClose, onSaved }: { product: any; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    id: product.id || undefined,
    name: product.name || "",
    slug: product.slug || "rebuild-recovery",
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    priceMinor: product.priceMinor || 4900,
    currency: product.currency || "USD",
    isActive: product.isActive !== false,
    featuresText: (product.features || []).map((f: any) => f.title + (f.text ? ": " + f.text : "")).join("\n"),
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const features = form.featuresText.split("\n").filter((l: string) => l.trim()).map((l: string) => {
      const [title, ...rest] = l.split(":");
      return { title: title.trim(), text: rest.join(":").trim() || undefined };
    });
    const r = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, features }) });
    const d = await r.json();
    setBusy(false);
    if (!d.ok) { toast(d.error || "Could not save.", "error"); return; }
    toast("Product saved.");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-admin-border bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-admin-ink">{product.id ? "Edit product" : "New product"}</h2>
          <button onClick={onClose} className="text-admin-muted hover:text-admin-ink">✕</button>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug"><Input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
            <Field label="Currency"><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (minor units)"><Input required type="number" value={form.priceMinor} onChange={(e) => setForm({ ...form, priceMinor: Number(e.target.value) })} /></Field>
            <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label></div>
          </div>
          <Field label="Short description"><Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></Field>
          <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Features (one per line, `Title: text`)" hint="These appear in the 'What you get' section."><Textarea rows={5} value={form.featuresText} onChange={(e) => setForm({ ...form, featuresText: e.target.value })} /></Field>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose} type="button">Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button></div>
        </form>
      </div>
    </div>
  );
}
