"use client";

import { useEffect, useState } from "react";
import { Card, Button, Field, Input, Textarea, Select, StatusPill, LoadingState, ErrorState } from "@/components/admin/ui";
import { useToast } from "@/components/admin/ToastProvider";
import { usePermission } from "@/components/admin/PermissionProvider";

export function SettingsClient() {
  const { can } = usePermission();
  const [data, setData] = useState<any>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/settings", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) {
      setData(d);
      const init: Record<string, string> = {};
      for (const g of d.groups) for (const f of g.fields) init[f.key] = f.value;
      setValues(init);
    } else toast("Could not load.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  function set(k: string, v: string) { setValues((p) => ({ ...p, [k]: v })); setDirty(true); }

  async function save() {
    setBusy(true);
    const r = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values }) });
    const d = await r.json();
    setBusy(false);
    if (!d.ok) { toast(d.error || "Could not save.", "error"); return; }
    toast("Settings saved.");
    setDirty(false);
    load();
  }

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState title="Couldn't load settings" retry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Settings</h1>
          <p className="text-sm text-admin-muted">Business, commerce, email, analytics, security, and legal configuration.</p>
        </div>
        {can("settings:manage") && <Button onClick={save} disabled={!dirty || busy}>{busy ? "Saving…" : dirty ? "Save changes" : "Saved"}</Button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EnvStat label="Payment mode" value={data.env.paymentMode} />
        <EnvStat label="Email transport" value={data.env.emailTransport} />
        <EnvStat label="Analytics" value={data.env.analyticsProvider} />
        <EnvStat label="Storage" value={data.env.storage} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {data.groups.map((g: any) => (
          <Card key={g.key} title={g.label}>
            <div className="space-y-3">
              {g.fields.map((f: any) => (
                <Field key={f.key} label={f.label} hint={f.type === "boolean" ? undefined : f.key}>
                  {f.type === "boolean" ? (
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={values[f.key] === "true"} onChange={(e) => set(f.key, e.target.checked ? "true" : "false")} disabled={!can("settings:manage")} /> {values[f.key] === "true" ? "Enabled" : "Disabled"}</label>
                  ) : f.type === "number" ? (
                    <Input type="number" value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} disabled={!can("settings:manage")} />
                  ) : (
                    <Input value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} disabled={!can("settings:manage")} />
                  )}
                </Field>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card title="Payment providers (managed separately)">
        <div className="flex flex-wrap gap-2">
          {data.env.providers.map((p: any) => (
            <span key={p.key} className="flex items-center gap-2 rounded-lg border border-admin-border px-3 py-1.5 text-sm"><span className="capitalize">{p.name}</span><StatusPill status={p.enabled ? "active" : "disabled"} /></span>
          ))}
        </div>
        <p className="mt-2 text-xs text-admin-muted">Credentials, test/live switching, and enable/disable live in <a href="/admin/payment-providers" className="text-gold-600 hover:underline">Payment Providers</a>.</p>
      </Card>
    </div>
  );
}

function EnvStat({ label, value }: { label: string; value: string }) {
  return <Card><p className="text-xs uppercase text-admin-muted">{label}</p><p className="mt-1 capitalize font-serif text-lg font-semibold text-admin-ink">{value}</p></Card>;
}
