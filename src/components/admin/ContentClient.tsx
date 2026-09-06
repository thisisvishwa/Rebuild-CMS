"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, StatusPill, Button, Field, Input, LoadingState, ErrorState } from "@/components/admin/ui";
import { useToast } from "@/components/admin/ToastProvider";
import { usePermission } from "@/components/admin/PermissionProvider";

export function ContentClient() {
  const { can } = usePermission();
  const [sections, setSections] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/content", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) { setSections(d.sections); setSelected((s: any) => s ?? d.sections[0]); } else setError("Could not load content.");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function save() {
    if (!selected) return;
    const r = await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(selected) });
    const d = await r.json();
    if (!d.ok) { toast("Could not save.", "error"); return; }
    toast("Section published.");
    load();
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title="Couldn't load content" body={error} retry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Website CMS</h1>
          <p className="text-sm text-admin-muted">Edit landing-page section content. Changes publish to the storefront instantly.</p>
        </div>
        <Link href="/" target="_blank" className="text-sm text-gold-600 hover:underline">View site →</Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-4">
        <div className="space-y-1">
          {sections.map((s) => (
            <button key={s.key} onClick={() => setSelected(s)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selected?.key === s.key ? "bg-gold-600 text-white" : "bg-gray-100 text-admin-ink hover:bg-gray-200"}`}>
              <span>{s.label}</span><StatusPill status={s.published ? "published" : "draft"} />
            </button>
          ))}
        </div>
        <div className="lg:col-span-3">
          {selected && <SectionForm key={selected.id + selected.key} section={selected} onChange={setSelected} canManage={can("cms:manage")} onSave={save} />}
        </div>
      </div>
    </div>
  );
}

function SectionForm({ section, onChange, canManage, onSave }: { section: any; onChange: (s: any) => void; canManage: boolean; onSave: () => void }) {
  const [contentText, setContentText] = useState(JSON.stringify(section.content, null, 2));
  const [parseError, setParseError] = useState("");

  function commit() {
    try {
      const parsed = JSON.parse(contentText);
      onChange({ ...section, content: parsed });
      setParseError("");
    } catch (e) {
      setParseError("Invalid JSON — fix before saving.");
    }
  }

  return (
    <Card title={`${section.label} (${section.key})`} action={canManage && <Button variant="outline" onClick={() => onChange({ ...section, published: !section.published })}>{section.published ? "Unpublish" : "Publish"}</Button>}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Label"><Input value={section.label} onChange={(e) => onChange({ ...section, label: e.target.value })} /></Field>
          <Field label="Sort order"><Input type="number" value={section.sortOrder} onChange={(e) => onChange({ ...section, sortOrder: Number(e.target.value) })} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={section.isEnabled} onChange={(e) => onChange({ ...section, isEnabled: e.target.checked })} /> Section enabled</label>
        <Field label="Content (JSON)" hint={parseError || "Structured JSON for this section, e.g. { headline, subheadline, cta }"}><textarea rows={22} value={contentText} onChange={(e) => setContentText(e.target.value)} className="w-full rounded-lg border border-admin-border px-3 py-2 font-mono text-xs" /></Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setContentText(JSON.stringify(section.content, null, 2)); onChange({ ...section, content: JSON.parse(JSON.stringify(section.content)) }); }}>Reset</Button>
          <Button onClick={() => { if (contentText) commit(); onSave(); }}>{section.published ? "Save &amp; Publish" : "Save Draft"}</Button>
        </div>
      </div>
    </Card>
  );
}
