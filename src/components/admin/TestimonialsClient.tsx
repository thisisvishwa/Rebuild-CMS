"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Field, Input, Textarea, LoadingState, ErrorState } from "@/components/admin/ui";
import { useToast } from "@/components/admin/ToastProvider";

export function TestimonialsClient() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<any>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/testimonials", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setItems(d.testimonials); else setError("Could not load testimonials.");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    await fetch("/api/admin/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, _delete: true }) });
    toast("Deleted.");
    load();
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title="Couldn't load testimonials" body={error} retry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Testimonials</h1>
          <p className="text-sm text-admin-muted">Stories shared with consent. Only publish testimonials with a recorded <code className="text-xs">permission</code> statement.</p>
        </div>
        <Button onClick={() => setEditor({})}>+ Add testimonial</Button>
      </div>
      <Card>
        {items.length ? (
          <div className="divide-y divide-admin-border">
            {items.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <div className="flex items-center gap-2"><p className="font-medium text-admin-ink">{t.name}</p>{t.age && <span className="text-xs text-admin-muted">{t.age}</span>}<StatusPill status={t.isPublished ? "active" : "disabled"} /></div>
                  <p className="mt-1 text-sm text-admin-muted line-clamp-3">“{t.quote}”</p>
                  <p className="mt-1 text-xs text-admin-muted">Permission: {t.permission || "not set"}</p>
                </div>
                <div className="flex gap-2"><Button variant="outline" onClick={() => setEditor(t)}>Edit</Button><Button variant="ghost" onClick={() => remove(t.id)}>Delete</Button></div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-admin-muted">No testimonials yet.</p>}
      </Card>
      {editor !== null && <TestimonialEditor item={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />}
    </div>
  );
}

function TestimonialEditor({ item, onClose, onSaved }: { item: any; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ id: item.id || undefined, name: item.name || "", quote: item.quote || "", age: item.age || "", situation: item.situation || "", location: item.location || "", permission: item.permission || "", isPublished: item.isPublished !== false });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/admin/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, age: form.age ? Number(form.age) : null }) });
    const d = await r.json();
    setBusy(false);
    if (!d.ok) { toast("Could not save.", "error"); return; }
    toast("Saved.");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-admin-border bg-white p-6 shadow-xl">
        <h2 className="font-serif text-xl font-semibold text-admin-ink">{item.id ? "Edit testimonial" : "New testimonial"}</h2>
        <div className="mt-4 space-y-3">
          <Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Age"><Input type="number" value={form.age as any} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
            <Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          </div>
          <Field label="Quote"><Textarea required rows={4} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} /></Field>
          <Field label="Situation"><Input value={form.situation} onChange={(e) => setForm({ ...form, situation: e.target.value })} /></Field>
          <Field label="Consent / permission" hint="e.g. 'email opt-in verified'"><Input value={form.permission} onChange={(e) => setForm({ ...form, permission: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label>
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button></div>
      </form>
    </div>
  );
}
