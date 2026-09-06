"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Input, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";

export function DownloadsClient() {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [counts, setCounts] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function load(query = q) {
    setLoading(true);
    const r = await fetch(`/api/admin/downloads?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    const d = await r.json();
    if (d.ok) { setDownloads(d.downloads); setCounts(d.counts); } else toast("Could not load.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(""); }, []);

  if (loading) return <LoadingState />;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Downloads</h1>
          <p className="text-sm text-admin-muted">Audit log of eBook file downloads by customers.</p>
        </div>
        <div className="flex gap-2"><Input placeholder="Search customer / product" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="w-64" /><Button variant="outline" onClick={() => load()}>Search</Button></div>
      </div>
      <Card>
        {downloads.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-admin-border text-left text-xs uppercase text-admin-muted">
                <th className="px-3 py-2">Customer</th><th className="px-3 py-2">Product</th><th className="px-3 py-2">Version</th>
                <th className="px-3 py-2">IP</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Date</th>
              </tr></thead>
              <tbody>
                {downloads.map((d) => (
                  <tr key={d.id} className="border-b border-admin-border last:border-0">
                    <td className="px-3 py-2">{d.customer?.email}</td>
                    <td className="px-3 py-2">{d.product?.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">v{d.version?.version ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs text-admin-muted">{d.ip || "—"}</td>
                    <td className="px-3 py-2"><StatusPill status={d.status} /></td>
                    <td className="px-3 py-2 text-admin-muted">{formatDateTime(d.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-admin-muted">No downloads recorded yet.</p>}
      </Card>
    </div>
  );
}
