"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input, Badge, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";

export function AuditClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function load(query = q) {
    setLoading(true);
    const r = await fetch(`/api/admin/audit?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setLogs(d.logs); else { toast("Could not load.", "error"); setLoading(false); return; }
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(""); }, []);

  if (loading) return <LoadingState />;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Audit Logs</h1>
          <p className="text-sm text-admin-muted">Append-only trail of every sensitive admin action. Recorded by time, actor, and before/after values.</p>
        </div>
        <div className="flex gap-2"><Input placeholder="Search action / resource / user" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="w-72" /><Button variant="outline" onClick={() => load()}>Search</Button></div>
      </div>
      <Card>
        {logs.length ? (
          <div className="divide-y divide-admin-border">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-4 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><Badge tone="info">{l.action}</Badge><span className="font-mono text-xs text-admin-muted">{l.resource}{l.resourceId ? `:${String(l.resourceId).slice(0, 10)}` : ""}</span></div>
                  <p className="mt-1 text-xs text-admin-muted">{l.user?.name ?? l.user?.email ?? "System"} · {l.ip || "—"}</p>
                  {(l.before || l.after) && <p className="mt-1 min-w-0 break-all font-mono text-[11px] text-admin-muted">before: {l.before || "—"} <span className="text-gold-600">after: {l.after || "—"}</span></p>}
                </div>
                <span className="shrink-0 text-xs text-admin-muted">{formatDateTime(l.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-admin-muted">No audit entries yet.</p>}
      </Card>
    </div>
  );
}
