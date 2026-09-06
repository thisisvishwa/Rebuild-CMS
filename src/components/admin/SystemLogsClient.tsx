"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Input, Select, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";

const LEVEL_TONE: Record<string, string> = { info: "sent", warning: "pending", error: "failed", critical: "failed" };

export function SystemLogsClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [level, setLevel] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/admin/logs?level=${level}&q=${encodeURIComponent(q)}`, { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setLogs(d.logs); else toast("Could not load.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">System Logs</h1>
          <p className="text-sm text-admin-muted">Operational logs from services, endpoints, and workers.</p>
        </div>
        <div className="flex gap-2">
          <Select value={level} onChange={(e) => { setLevel(e.target.value); }} className="w-36"><option value="">All levels</option><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option><option value="critical">Critical</option></Select>
          <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="w-56" />
          <Button variant="outline" onClick={load}>Filter</Button>
        </div>
      </div>
      <Card>
        {logs.length ? (
          <div className="space-y-1">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                <StatusPill status={LEVEL_TONE[l.level] ?? l.level} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-admin-ink">{l.message}</p>
                  <p className="text-xs text-admin-muted">{l.service || "—"} {l.endpoint ? `· ${l.endpoint}` : ""} {l.code ? `· ${l.code}` : ""}</p>
                </div>
                <span className="shrink-0 text-xs text-admin-muted">{formatDateTime(l.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-admin-muted">No logs match this filter.</p>}
      </Card>
    </div>
  );
}
