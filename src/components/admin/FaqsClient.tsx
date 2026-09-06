"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Field, Input, Textarea, LoadingState, ErrorState } from "@/components/admin/ui";
import { useToast } from "@/components/admin/ToastProvider";

export function FaqsClient() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<any>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/faqs", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setFaqs(d.faqs); else setError("Could not load FAQs.");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    await fetch("/api/admin/faqs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, _delete: true }) });
    toast("Deleted.");
    load();
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title="Couldn't load FAQs" body={error} retry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">FAQs</h1>
          <p className="text-sm text-admin-muted">Questions &amp; answers shown in the FAQ section.</p>
        </div>
        <Button onClick={() => setEditor({})}>+ Add FAQ</Button>
      </div>
      <Card>
        {faqs.length ? (
          <div className="divide-y divide-admin-border">
            {faqs.map((f) => (
              <div key={f.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <div className="flex items-center gap-2"><p className="font-medium text-admin-ink">{f.question}</p><StatusPill status={f.isPublished ? "active" : "disabled"} /></div>
                  <p className="mt-1 text-sm text-admin-muted line-clamp-2">{f.answer}</p>
                  {f.category && <p className="mt-1 text-xs text-admin-muted">{f.category}</p>}
                </div>
                <div className="flex gap-2"><Button variant="outline" onClick={() => setEditor(f)}>Edit</Button><Button variant="ghost" onClick={() => remove(f.id)}>Delete</Button></div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-admin-muted">No FAQs yet.</p>}
      </Card>
      {editor !== null && <FaqEditor faq={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />}
    </div>
  );
}

function FaqEditor({ faq, onClose, onSaved }: { faq: any; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ id: faq.id || undefined, question: faq.question || "", answer: faq.answer || "", category: faq.category || "", isPublished: faq.isPublished !== false });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/admin/faqs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    setBusy(false);
    if (!d.ok) { toast("Could not save.", "error"); return; }
    toast("Saved.");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-admin-border bg-white p-6 shadow-xl">
        <h2 className="font-serif text-xl font-semibold text-admin-ink">{faq.id ? "Edit FAQ" : "New FAQ"}</h2>
        <div className="mt-4 space-y-3">
          <Field label="Question"><Input required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></Field>
          <Field label="Answer"><Textarea required rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></Field>
          <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="purchasing" /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label>
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button></div>
      </form>
    </div>
  );
}
