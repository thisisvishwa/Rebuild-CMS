"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Field, Input, Textarea, LoadingState, ErrorState } from "@/components/admin/ui";
import { useToast } from "@/components/admin/ToastProvider";
import { usePermission } from "@/components/admin/PermissionProvider";

const LABELS: Record<string, string> = { razorpay: "Razorpay", paypal: "PayPal", wise: "Wise" };

export function PaymentProvidersClient() {
  const { can } = usePermission();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<any>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/payment-providers", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setProviders(d.providers); else setError("Could not load providers.");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title="Couldn't load providers" body={error} retry={load} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-admin-ink">Payment Providers</h1>
        <p className="text-sm text-admin-muted">Enable/disable providers, switch test vs live, and manage credentials. Secrets are encrypted at rest.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {providers.map((p) => (
          <Card key={p.key} action={can("payments:manage") && <Button variant="outline" onClick={() => setEditor(p)}>Configure</Button>}>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-admin-ink">{LABELS[p.key] ?? p.name}</h3>
              <StatusPill status={p.enabled ? "active" : "disabled"} />
            </div>
            <div className="mt-3 space-y-1 text-sm text-admin-muted">
              <p className="flex justify-between"><span>Appears on checkout</span><StatusPill status={p.showOnCheckout ? "active" : "disabled"} /></p>
              <p className="flex justify-between"><span>Environment</span><span className="font-mono text-xs capitalize">{p.environment}</span></p>
              <p className="flex justify-between"><span>Test credentials</span><span>{p.testKey ? "Set" : "—"}</span></p>
              <p className="flex justify-between"><span>Live credentials</span><span>{p.liveKey ? "Set" : "—"}</span></p>
            </div>
            {p.notes && <p className="mt-3 text-xs text-admin-muted">{p.notes}</p>}
          </Card>
        ))}
      </div>
      {editor && <Editor provider={editor} onClose={() => setEditor(null)} onCb={() => { setEditor(null); load(); }} />}
    </div>
  );
}

function Editor({ provider, onClose, onCb }: { provider: any; onClose: () => void; onCb: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    enabled: provider.enabled,
    showOnCheckout: provider.showOnCheckout,
    environment: provider.environment,
    testKey: provider.testKey || "",
    testSecret: "",
    liveKey: provider.liveKey || "",
    liveSecret: "",
    notes: provider.notes || "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/admin/payment-providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: provider.key, ...form }) });
    const d = await r.json();
    setBusy(false);
    if (!d.ok) { toast(d.error || "Could not save.", "error"); return; }
    toast("Provider updated.");
    onCb();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-admin-border bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-admin-ink">{provider.name} — Configure</h2>
          <button type="button" onClick={onClose} className="text-admin-muted hover:text-admin-ink">✕</button>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enabled</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.showOnCheckout} onChange={(e) => setForm({ ...form, showOnCheckout: e.target.checked })} /> Show on checkout</label>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-admin-muted">Environment</span>
            <div className="flex gap-3">
              {["sandbox", "live"].map((env) => (
                <label key={env} className="flex items-center gap-2 text-sm capitalize"><input type="radio" name="env" checked={form.environment === env} onChange={() => setForm({ ...form, environment: env })} /> {env}</label>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Test API key"><Input value={form.testKey} onChange={(e) => setForm({ ...form, testKey: e.target.value })} placeholder={provider.testKey ? "••••••" : "Key"} /></Field>
            <Field label="Test secret" hint={provider.testSecret ? "Currently set — enter to replace" : "Leave blank to keep empty"}><Input type="password" value={form.testSecret} onChange={(e) => setForm({ ...form, testSecret: e.target.value })} placeholder="••••••" /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Live API key"><Input value={form.liveKey} onChange={(e) => setForm({ ...form, liveKey: e.target.value })} placeholder={provider.liveKey ? "••••••" : "Key"} /></Field>
            <Field label="Live secret" hint={provider.liveSecret ? "Currently set — enter to replace" : "Leave blank to keep empty"}><Input type="password" value={form.liveSecret} onChange={(e) => setForm({ ...form, liveSecret: e.target.value })} placeholder="••••••" /></Field>
          </div>
          <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button></div>
      </form>
    </div>
  );
}
