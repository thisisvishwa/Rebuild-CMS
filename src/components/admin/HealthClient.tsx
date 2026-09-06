"use client";

import { useEffect, useState } from "react";
import { Card, Button, StatusPill, LoadingState, ErrorState } from "@/components/admin/ui";
import { useToast } from "@/components/admin/ToastProvider";

export function HealthClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/health", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setData(d); else toast("Could not load.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState title="Couldn't load health" retry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">System Health</h1>
          <p className="text-sm text-admin-muted">Live checks on the database, payments, email, and runtime.</p>
        </div>
        <Button variant="outline" onClick={load}>Re-run checks</Button>
      </div>

      <Card title="Checks">
        <div className="space-y-2">
          {data.checks.map((c: any) => (
            <div key={c.key} className="flex items-center justify-between rounded-lg border border-admin-border px-3 py-2">
              <div><p className="text-sm font-medium text-admin-ink">{c.label}</p><p className="text-xs text-admin-muted">{c.detail}</p></div>
              <StatusPill status={c.ok ? "active" : "disabled"} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Runtime"><p className="text-2xl font-semibold text-admin-ink">{data.uptimeSeconds}s</p><p className="text-xs text-admin-muted">uptime</p></Card>
        <Card title="Memory"><p className="text-2xl font-semibold text-admin-ink">{data.memory.rssMb} MB</p><p className="text-xs text-admin-muted">RSS · {data.memory.heapMb} MB heap</p></Card>
        <Card title="Versions"><p className="text-xs text-admin-muted">Node {data.versions.node}</p><p className="text-xs text-admin-muted">Next {data.versions.next}</p><p className="text-xs text-admin-muted">Prisma {data.versions.prisma}</p></Card>
      </div>

      <Card title="Database"><p className="text-sm text-admin-ink">{data.db.ok ? "Connected" : "Unreachable"}</p><p className="text-xs text-admin-muted">Latency: {data.db.latencyMs}ms</p></Card>
    </div>
  );
}
