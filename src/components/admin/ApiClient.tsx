"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Field, Input, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";
import { usePermission } from "@/components/admin/PermissionProvider";

export function ApiClient() {
  const { can } = usePermission();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/api", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setData(d); else toast("Could not load.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function create(name: string, expires: string) {
    const r = await fetch("/api/admin/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", name, scopes: ["orders:read"], expiresAt: expires || null }) });
    const d = await r.json();
    if (!d.ok) { toast(d.error || "Failed.", "error"); return; }
    alert(`API key created:\n\n${d.key}\n\n${d.note}`);
    load();
  }
  async function act(id: string, action: string, extra?: object) {
    await fetch("/api/admin/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id, ...extra }) });
    load();
  }

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState title="Couldn't load API keys" retry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">API &amp; Webhooks</h1>
          <p className="text-sm text-admin-muted">Server-side API keys and incoming payment webhooks.</p>
        </div>
        {can("system:manage") && <Button onClick={() => setCreating(true)}>+ New API key</Button>}
      </div>

      <Card title="API keys">
        <div className="divide-y divide-admin-border">
          {data.keys.map((k: any) => (
            <div key={k.id} className="flex items-center justify-between py-2">
              <div><p className="text-sm font-medium text-admin-ink">{k.name}</p><p className="font-mono text-xs text-admin-muted">{k.keyHash}</p><p className="text-xs text-admin-muted">{k.user?.email} · {formatDateTime(k.createdAt)} · scopes {JSON.parse(k.scopes || "[]").join(", ") || "none"}</p></div>
              <div className="flex gap-2"><StatusPill status={k.isActive ? "active" : "disabled"} /><StatusPill status={k.expiresAt && new Date(k.expiresAt) < new Date() ? "expired" : "active"} />{can("system:manage") && <Button variant="ghost" onClick={() => act(k.id, k.isActive ? "toggle" : "toggle", { isActive: !k.isActive })}>{k.isActive ? "Deactivate" : "Activate"}</Button>}{can("system:manage") && <Button variant="ghost" onClick={() => act(k.id, "delete")}>Delete</Button>}</div>
            </div>
          ))}
          {!data.keys.length && <p className="py-2 text-sm text-admin-muted">No API keys yet.</p>}
        </div>
      </Card>

      <Card title="Webhooks (received)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-admin-border text-left text-xs uppercase text-admin-muted"><th className="px-3 py-2">Provider</th><th className="px-3 py-2">Event</th><th className="px-3 py-2">Signature</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Date</th></tr></thead>
            <tbody>
              {data.webhooks.map((w: any) => (
                <tr key={w.id} className="border-b border-admin-border last:border-0">
                  <td className="px-3 py-2 capitalize">{w.provider}</td>
                  <td className="px-3 py-2 font-mono text-xs">{w.eventType}</td>
                  <td className="px-3 py-2"><StatusPill status={w.signatureValid ? "active" : "disabled"} /></td>
                  <td className="px-3 py-2"><StatusPill status={w.status} /></td>
                  <td className="px-3 py-2 text-admin-muted">{formatDateTime(w.createdAt)}</td>
                </tr>
              ))}
              {!data.webhooks.length && <tr><td colSpan={5} className="px-3 py-2 text-sm text-admin-muted">No webhooks received yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {creating && <CreateKeyModal onClose={() => setCreating(false)} onCreate={create} />}
    </div>
  );
}

function CreateKeyModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, expires: string) => void }) {
  const [name, setName] = useState("");
  const [expires, setExpires] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={(e) => { e.preventDefault(); onCreate(name, expires); }} className="w-full max-w-md rounded-2xl border border-admin-border bg-white p-6 shadow-xl">
        <h2 className="font-serif text-xl font-semibold text-admin-ink">New API key</h2>
        <div className="mt-4 space-y-3">
          <Field label="Name"><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Export integration" /></Field>
          <Field label="Expires (optional)"><Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></Field>
          <p className="text-xs text-admin-muted">The key is shown exactly once after creation. Store it securely; never expose it in client code.</p>
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Create</Button></div>
      </form>
    </div>
  );
}
