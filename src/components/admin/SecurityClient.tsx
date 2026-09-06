"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Field, Input, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";

export function SecurityClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/security", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setData(d); else toast("Could not load.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function post(action: string, extra?: object) {
    const r = await fetch("/api/admin/security", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
    const d = await r.json();
    if (!d.ok) { toast(d.error || "Failed.", "error"); return null; }
    return d;
  }
  async function savePolicy() {
    const r = await post("policy", { mfaRequired: data.policy.mfaRequired, sessionHours: data.policy.sessionHours });
    if (r) { toast("Policy saved."); load(); }
  }
  async function enable() {
    const r = await post("enableMfa", { secret: data.mfaSetup.secret, code });
    if (r) { setRecovery(r.recoveryCodes); toast("MFA enabled — save your recovery codes."); load(); }
  }
  async function disable() {
    if (!confirm("Disable MFA for your account?")) return;
    await post("disableMfa"); toast("MFA disabled."); load();
  }

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState title="Couldn't load security" retry={load} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-admin-ink">Security</h1>
        <p className="text-sm text-admin-muted">MFA policy, your 2FA setup, and active sessions.</p>
      </div>

      <Card title="Policy">
        <div className="space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span className="text-admin-ink">Require MFA for all admins</span>
            <input type="checkbox" disabled={!data.policy} checked={data.policy.mfaRequired} onChange={(e) => setData({ ...data, policy: { ...data.policy, mfaRequired: e.target.checked } })} />
          </label>
          <Field label="Session length (hours)"><Input type="number" value={data.policy.sessionHours} onChange={(e) => setData({ ...data, policy: { ...data.policy, sessionHours: Number(e.target.value) } })} /></Field>
          <div className="flex justify-end"><Button onClick={savePolicy}>Save policy</Button></div>
        </div>
      </Card>

      <Card title="Your 2FA">
        {data.me.mfaEnabled ? (
          <div>
            <p className="flex items-center gap-2 text-sm"><StatusPill status="active" /> MFA is enabled on your account.</p>
            <p className="mt-1 text-xs text-admin-muted">Recovery codes: {data.me.recoveryCodesActive ? "available" : "none"}</p>
            <div className="mt-3"><Button variant="outline" onClick={disable}>Disable MFA</Button></div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-admin-muted">Scan the QR (or enter the secret) in your authenticator app, then enter the 6-digit code to enable.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-100 p-3 text-center"><p className="text-xs uppercase text-admin-muted">Secret</p><p className="mt-1 break-all font-mono text-sm">{data.mfaSetup.secret}</p></div>
              {recovery && (
                <div className="rounded-lg border border-gold-200 bg-gold-50 p-3"><p className="text-xs font-semibold text-gold-700">Save these recovery codes</p><div className="mt-1 grid grid-cols-2 gap-1 font-mono text-xs">{recovery.map((c) => <span key={c}>{c}</span>)}</div></div>
              )}
            </div>
            <div className="mt-3 flex items-end gap-2"><Field label="6-digit code"><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="w-40" /></Field><Button onClick={enable}>Enable</Button></div>
          </div>
        )}
      </Card>

      <Card title={`Active sessions (${data.sessions.length})`}>
        <div className="divide-y divide-admin-border">
          {data.sessions.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between py-2">
              <div><p className="text-sm text-admin-ink">{s.user?.name} · {s.user?.email}</p><p className="text-xs text-admin-muted">{formatDateTime(s.lastSeen)} · {s.device || "—"} {s.ip ? `· ${s.ip}` : ""}</p></div>
              <Button variant="ghost" onClick={async () => { await post("revokeSession", { sessionId: s.id }); toast("Session revoked."); load(); }}>Revoke</Button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-end"><Button variant="outline" onClick={async () => { await post("revokeAll"); toast("Other sessions revoked."); load(); }}>Revoke all other sessions</Button></div>
      </Card>
    </div>
  );
}
