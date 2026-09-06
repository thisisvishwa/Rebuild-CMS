"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Field, Input, Textarea, LoadingState, ErrorState } from "@/components/admin/ui";
import { useToast } from "@/components/admin/ToastProvider";

export function LegalClient() {
  const [pages, setPages] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/legal", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) { setPages(d.pages); setSelected((s: any) => s ?? d.pages[0]); } else setError("Could not load legal pages.");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function save() {
    if (!selected) return;
    const r = await fetch("/api/admin/legal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(selected) });
    const d = await r.json();
    if (!d.ok) { toast("Could not save.", "error"); return; }
    toast("Legal page saved.");
    load();
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title="Couldn't load legal pages" body={error} retry={load} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-admin-ink">Legal Pages</h1>
        <p className="text-sm text-admin-muted">Privacy, terms, refund and disclaimer pages. Real content should be reviewed with counsel before going live.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-4">
        <div className="space-y-1">
          {pages.map((p) => (
            <button key={p.slug} onClick={() => setSelected(p)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selected?.slug === p.slug ? "bg-gold-600 text-white" : "bg-gray-100 text-admin-ink hover:bg-gray-200"}`}>
              <span>{p.title}</span><StatusPill status={p.status === "published" ? "active" : "disabled"} />
            </button>
          ))}
        </div>
        <div className="lg:col-span-3">
          {selected && <LegalForm key={selected.slug} page={selected} onChange={setSelected} onSave={save} />}
        </div>
      </div>
    </div>
  );
}

function LegalForm({ page, onChange, onSave }: { page: any; onChange: (p: any) => void; onSave: () => void }) {
  const [contentText, setContentText] = useState(JSON.stringify(page.content, null, 2));

  function commit() {
    let content = page.content;
    try { content = JSON.parse(contentText); } catch { /* keep old */ }
    onChange({ ...page, content });
  }

  return (
    <Card title={page.title} action={<Button variant="outline" onClick={() => onChange({ ...page, status: page.status === "published" ? "draft" : "published" })}>{page.status === "published" ? "Unpublish" : "Publish"}</Button>}>
      <div className="space-y-3">
        <Field label="Title"><Input value={page.title} onChange={(e) => onChange({ ...page, title: e.target.value })} /></Field>
        <Field label="Updated"><Input value={page.updated || ""} onChange={(e) => onChange({ ...page, updated: e.target.value })} /></Field>
        <Field label="Intro"><Textarea rows={2} value={page.intro || ""} onChange={(e) => onChange({ ...page, intro: e.target.value })} /></Field>
        <Field label="Sections (JSON: [{heading, body}])"><Textarea rows={16} value={contentText} onChange={(e) => setContentText(e.target.value)} /></Field>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setContentText(JSON.stringify(page.content, null, 2))}>Reset</Button><Button onClick={() => { commit(); onSave(); }}>Save &amp; Publish</Button></div>
      </div>
    </Card>
  );
}
