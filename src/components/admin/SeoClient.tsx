"use client";

import { useEffect, useState } from "react";
import { Card, Button, Field, Input, Textarea, LoadingState, ErrorState } from "@/components/admin/ui";
import { useToast } from "@/components/admin/ToastProvider";

export function SeoClient() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/seo", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) { setItems(d.seo); setSelected((s: any) => s ?? d.seo[0]); } else setError("Could not load SEO.");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function save(form: any) {
    const r = await fetch("/api/admin/seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!d.ok) { toast("Could not save.", "error"); return; }
    toast("SEO saved.");
    load();
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title="Couldn't load SEO" body={error} retry={load} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-admin-ink">SEO</h1>
        <p className="text-sm text-admin-muted">Search metadata per page.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-4">
        <div className="space-y-1">
          {items.map((s) => (
            <button key={s.slug} onClick={() => setSelected(s)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${selected?.slug === s.slug ? "bg-gold-600 text-white" : "bg-gray-100 text-admin-ink hover:bg-gray-200"}`}>{s.slug}</button>
          ))}
        </div>
        <div className="lg:col-span-3">
          {selected && <SeoForm key={selected.slug} seo={selected} onSave={save} />}
        </div>
      </div>
    </div>
  );
}

function SeoForm({ seo, onSave }: { seo: any; onSave: (f: any) => void }) {
  const [form, setForm] = useState({ slug: seo.slug, title: seo.title || "", description: seo.description || "", ogTitle: seo.ogTitle || "", ogDescription: seo.ogDescription || "", ogImage: seo.ogImage || "", canonical: seo.canonical || "", robots: seo.robots || "index,follow" });
  return (
    <Card title={form.slug}>
      <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, title: form.title || null, description: form.description || null, ogTitle: form.ogTitle || null, ogDescription: form.ogDescription || null, ogImage: form.ogImage || null, canonical: form.canonical || null, robots: form.robots || null }); }} className="space-y-3">
        <Field label="Meta title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Meta description"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="OG title"><Input value={form.ogTitle} onChange={(e) => setForm({ ...form, ogTitle: e.target.value })} /></Field>
          <Field label="OG image URL"><Input value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} /></Field>
        </div>
        <Field label="OG description"><Textarea rows={2} value={form.ogDescription} onChange={(e) => setForm({ ...form, ogDescription: e.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Canonical"><Input value={form.canonical} onChange={(e) => setForm({ ...form, canonical: e.target.value })} /></Field>
          <Field label="Robots"><Input value={form.robots} onChange={(e) => setForm({ ...form, robots: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end"><Button type="submit">Save</Button></div>
      </form>
    </Card>
  );
}
