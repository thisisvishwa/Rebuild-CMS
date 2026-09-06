"use client";

import { useEffect, useState } from "react";
import { Card, Stat, StatusPill, Button, LoadingState, ErrorState, BarChart } from "@/components/admin/ui";
import { useToast } from "@/components/admin/ToastProvider";

export function AnalyticsClient() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function load(d = days) {
    setLoading(true);
    const r = await fetch(`/api/admin/analytics?days=${d}`, { cache: "no-store" });
    const j = await r.json();
    if (j.ok) setData(j); else toast("Could not load analytics.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(30); }, []);

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState title="Couldn't load analytics" retry={() => load()} />;

  const f = data.funnel;
  const steps = [
    { label: "Visitors", value: f.visitors },
    { label: "Sessions", value: f.sessions },
    { label: "Checkout started", value: f.checkoutStarted },
    { label: "Payment initiated", value: f.paymentInitiated },
    { label: "Purchased", value: f.purchaseCompleted },
    { label: "Downloaded", value: f.downloaded },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Analytics</h1>
          <p className="text-sm text-admin-muted">Page views, events, devices, countries, and the conversion funnel.</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => <Button key={d} variant={days === d ? "primary" : "outline"} onClick={() => { setDays(d); load(d); }}>{d} days</Button>)}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Page views" value={String(data.series.reduce((s: number, r: any) => s + r.count, 0))} />
        <Stat label="Devices" value={String(data.deviceBreakdown.length)} />
        <Stat label="Top country" value={data.topCountries[0]?.label ?? "—"} />
        <Stat label="Conversion (browse→buy)" value={`${(data.funnel.sessions ? (data.funnel.purchaseCompleted / data.funnel.sessions) * 100 : 0).toFixed(1)}%`} />
      </div>

      <Card title={`Page views (last ${days} days)`}>
        <BarChart data={data.series.map((s: any) => ({ label: s.date, value: s.count }))} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Events">
          <div className="space-y-2">
            {Object.entries(data.eventCounts).map(([e, c]) => (
              <div key={e} className="flex items-center justify-between text-sm"><span className="capitalize text-admin-ink">{e}</span><span className="font-medium">{c as number}</span></div>
            ))}
            {Object.keys(data.eventCounts).length === 0 && <p className="text-sm text-admin-muted">No events recorded.</p>}
          </div>
        </Card>
        <Card title="Devices">
          <BarChart data={data.deviceBreakdown} />
        </Card>
      </div>

      <Card title="Conversion funnel">
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3 text-sm">
              <span className="w-32 text-admin-muted">{s.label}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gold-500" style={{ width: `${Math.max(2, (s.value / Math.max(1, f.visitors)) * 100)}%` }} />
              </div>
              <span className="w-16 text-right font-medium">{s.value}</span>
              <span className="w-16 text-right text-xs text-admin-muted">{s.value ? `${((s.value / Math.max(1, f.visitors)) * 100).toFixed(0)}%` : "—"}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Top countries">
          <BarChart data={data.topCountries} />
        </Card>
        <Card title="Session stages">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Checkout started" value={f.checkoutStarted} />
            <MiniStat label="Payment initiated" value={f.paymentInitiated} />
            <MiniStat label="Purchased" value={f.purchaseCompleted} />
            <MiniStat label="Downloaded" value={f.downloaded} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-admin-border p-3"><p className="text-xs uppercase text-admin-muted">{label}</p><p className="mt-1 font-serif text-xl font-semibold text-admin-ink">{value}</p></div>;
}
