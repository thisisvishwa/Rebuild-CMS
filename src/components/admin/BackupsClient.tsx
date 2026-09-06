"use client";

import { useEffect, useState } from "react";
import { Card, Button, StatusPill, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatBytes, formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";

export function BackupsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/backups", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setData(d); else toast("Could not load.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function create() {
    setBusy(true);
    const r = await fetch("/api/admin/backups", { method: "POST" });
    const d = await r.json();
    setBusy(false);
    toast(d.ok ? `Backup created: ${d.name}` : (d.error || "Backup failed."), d.ok ? "success" : "error");
    load();
  }

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState title="Couldn't load backups" retry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Backups</h1>
          <p className="text-sm text-admin-muted">Snapshot copies of the database, stored under <code className="text-xs">storage/backups</code>.</p>
        </div>
        <Button onClick={create} disabled={busy}>{busy ? "Creating…" : "Create backup"}</Button>
      </div>

      <Card title="Backup files">
        {data.backups.length ? (
          <div className="divide-y divide-admin-border">
            {data.backups.map((b: any) => (
              <div key={b.name} className="flex items-center justify-between py-2">
                <div><p className="font-mono text-sm text-admin-ink">{b.name}</p><p className="text-xs text-admin-muted">{formatDateTime(b.createdAt)} · {formatBytes(b.size)}</p></div>
                <StatusPill status="active" />
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-admin-muted">No backups yet. Create one to snapshot the database.</p>}
      </Card>

      <Card title="Production note">
        <p className="text-sm text-admin-muted">In production with a managed database (Postgres/MySQL), use your provider's native point-in-time backups. This module primarily serves local SQLite and self-managed hosts, producing a shareable snapshot file.</p>
      </Card>
    </div>
  );
}
