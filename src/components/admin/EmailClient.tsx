"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Field, Input, Textarea, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";
import { usePermission } from "@/components/admin/PermissionProvider";

export function EmailClient() {
  const { can } = usePermission();
  const [tab, setTab] = useState<"templates" | "logs">("templates");
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<any>(null);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const [ta, la] = await Promise.all([
      fetch("/api/admin/email?tab=templates", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/email?tab=logs", { cache: "no-store" }).then((r) => r.json()),
    ]);
    if (ta.ok) setTemplates(ta.templates);
    if (la.ok) setLogs(la.logs);
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function save(t: any) {
    const r = await fetch("/api/admin/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "updateTemplate", ...t }) });
    const d = await r.json();
    toast(d.ok ? "Saved." : (d.error || "Failed."), d.ok ? "success" : "error");
    load();
  }

  async function test(t: any) {
    const to = prompt("Send test to email:", "admin@example.com");
    if (!to) return;
    const r = await fetch("/api/admin/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test", id: t.id, to }) });
    const d = await r.json();
    toast(d.ok ? d.message : (d.error || "Test failed."), d.ok ? "success" : "error");
  }

  if (loading) return <LoadingState />;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Email</h1>
          <p className="text-sm text-admin-muted">Transactional templates and delivery logs.</p>
        </div>
        <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
          <button onClick={() => setTab("templates")} className={`rounded-md px-3 py-1.5 ${tab === "templates" ? "bg-white shadow-sm" : "text-admin-muted"}`}>Templates</button>
          <button onClick={() => setTab("logs")} className={`rounded-md px-3 py-1.5 ${tab === "logs" ? "bg-white shadow-sm" : "text-admin-muted"}`}>Logs</button>
        </div>
      </div>

      {tab === "templates" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} action={can("email:manage") && <Button variant="outline" onClick={() => setEditor(t)}>Edit</Button>}>
              <div className="flex items-center justify-between"><h3 className="font-medium text-admin-ink">{t.name}</h3><StatusPill status={t.isActive ? "active" : "disabled"} /></div>
              <p className="mt-2 text-sm text-admin-ink">{t.subject}</p>
              <p className="mt-2 whitespace-pre-line text-xs text-admin-muted line-clamp-4">{t.body}</p>
              {can("email:manage") && <Button variant="ghost" onClick={() => test(t)} className="mt-3">Send test</Button>}
            </Card>
          ))}
        </div>
      ) : (
        <Card title="Delivery logs">
          {logs.length ? (
            <div className="divide-y divide-admin-border">
              {logs.map((l) => (
                <div key={l.id} className="flex items-start justify-between py-2">
                  <div><p className="text-sm text-admin-ink">{l.to}</p><p className="text-xs text-admin-muted">{l.template} · {l.subject}</p>{l.error && <p className="text-xs text-red-600">{l.error}</p>}</div>
                  <div className="flex items-center gap-2"><StatusPill status={l.status} /><span className="text-xs text-admin-muted">{formatDateTime(l.createdAt)}</span></div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-admin-muted">No emails sent yet.</p>}
        </Card>
      )}

      {editor && <TemplateEditor template={editor} onClose={() => setEditor(null)} onSave={(t) => { setEditor(null); save(t); }} />}
    </div>
  );
}

function TemplateEditor({ template, onClose, onSave }: { template: any; onClose: () => void; onSave: (t: any) => void }) {
  const [form, setForm] = useState({ id: template.id, subject: template.subject, body: template.body, isActive: template.isActive });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, id: template.id }); }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-admin-border bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between"><h2 className="font-serif text-xl font-semibold text-admin-ink">{template.name}</h2><button type="button" onClick={onClose} className="text-admin-muted">✕</button></div>
        <div className="mt-4 space-y-3">
          <Field label="Subject" hint="Supports {{variables}}"><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
          <Field label="Body" hint="Supports {{customer_name}}, {{product_name}}, {{order_id}}, {{amount}}, {{invoice_number}}, {{download_link}}">{<Textarea rows={12} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />}</Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </div>
  );
}
