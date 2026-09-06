"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatDateTime, timeAgo } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";

export function VisitorsClient() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function load(query = q) {
    setLoading(true);
    const r = await fetch(`/api/admin/visitors?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    const d = await r.json();
    if (d.ok) { setVisitors(d.visitors); setStats(d.stats); } else toast("Could not load.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(""); }, []);

  if (loading) return <LoadingState />;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Visitors</h1>
          <p className="text-sm text-admin-muted">Real visitor and session data from the tracking pixel.</p>
        </div>
        <div className="flex gap-2"><Input placeholder="Search country / source / visitor" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="w-72" /><Button variant="outline" onClick={() => load()}>Search</Button></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Online (30 min)" value={String(stats.online ?? 0)} />
        <Stat label="Total visitors" value={String(stats.totalVisitors ?? 0)} />
        <Stat label="Sessions (24h)" value={String(stats.sessions24h ?? 0)} />
        <Stat label="Page views (24h)" value={String(stats.pageviews24h ?? 0)} />
      </div>

      <Card>
        {visitors.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-admin-border text-left text-xs uppercase text-admin-muted">
                <th className="px-3 py-2">Visitor</th><th className="px-3 py-2">Country</th><th className="px-3 py-2">Device</th>
                <th className="px-3 py-2">Source</th><th className="px-3 py-2">Landing</th><th className="px-3 py-2">Last seen</th><th className="px-3 py-2">Visits</th>
              </tr></thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.id} className="border-b border-admin-border last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{v.visitorId.slice(0, 8)}…</td>
                    <td className="px-3 py-2">{v.country || "—"}</td>
                    <td className="px-3 py-2 capitalize">{v.device || "—"}</td>
                    <td className="px-3 py-2">{v.utmSource || v.referrer || "direct"}</td>
                    <td className="px-3 py-2 text-admin-muted">{v.landingPage || "—"}</td>
                    <td className="px-3 py-2 text-admin-muted">{timeAgo(v.lastSeen)}</td>
                    <td className="px-3 py-2">{v.visitCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-admin-muted">No visitor data yet. Site analytics will populate as people browse.</p>}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <Card><p className="text-xs uppercase text-admin-muted">{label}</p><p className="mt-1 font-serif text-2xl font-semibold text-admin-ink">{value}</p></Card>;
}
