"use client";

import { useEffect, useState } from "react";
import { Card, Stat, Button, LoadingState, ErrorState, BarChart } from "@/components/admin/ui";
import { useToast } from "@/components/admin/ToastProvider";

export function TrafficClient() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function load(d = days) {
    setLoading(true);
    const r = await fetch(`/api/admin/traffic?days=${d}`, { cache: "no-store" });
    const j = await r.json();
    if (j.ok) setData(j); else toast("Could not load traffic.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(30); }, []);

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState title="Couldn't load traffic" retry={() => load()} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Traffic Sources</h1>
          <p className="text-sm text-admin-muted">Where visitors come from and how sources convert.</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => <Button key={d} variant={days === d ? "primary" : "outline"} onClick={() => { setDays(d); load(d); }}>{d} days</Button>)}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Sessions" value={String(data.totalSessions)} />
        <Stat label="Purchases" value={String(data.totalPurchases)} />
        <Stat label="Conversion" value={`${(data.totalSessions ? (data.totalPurchases / data.totalSessions) * 100 : 0).toFixed(1)}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="By UTM source">
          <BarChart data={data.bySource} />
        </Card>
        <Card title="By medium">
          <BarChart data={data.byMedium} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="By campaign">
          <BarChart data={data.byCampaign} />
        </Card>
        <Card title="By referrer">
          <BarChart data={data.byReferrer} />
        </Card>
      </div>

      <Card title="Source breakdown">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-admin-border text-left text-xs uppercase text-admin-muted"><th className="px-3 py-2">Source</th><th className="px-3 py-2">Sessions</th><th className="px-3 py-2">Share</th></tr></thead>
          <tbody>
            {data.bySource.map((s: any) => (
              <tr key={s.label} className="border-b border-admin-border last:border-0">
                <td className="px-3 py-2">{s.label}</td>
                <td className="px-3 py-2">{s.count}</td>
                <td className="px-3 py-2 text-admin-muted">{data.totalSessions ? ((s.count / data.totalSessions) * 100).toFixed(1) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
