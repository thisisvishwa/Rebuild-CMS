"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Stat, Card, StatusPill, BarChart, LoadingState, ErrorState } from "@/components/admin/ui";
import { usePermission } from "@/components/admin/PermissionProvider";
import { formatCurrency } from "@/lib/admin/format";

export function DashboardClient() {
  const can = usePermission();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.ok ? setData(d) : setError("Could not load dashboard data.")))
      .catch(() => setError("Could not load dashboard data."));
  }, []);

  if (error) return <ErrorState title="Dashboard unavailable" body={error} />;
  if (!data) return <LoadingState label="Loading dashboard…" />;

  const cur = data.sales;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-admin-ink">Dashboard</h1>
        <p className="text-sm text-admin-muted">Business overview &amp; live performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Today's revenue" value={formatCurrency(cur.today)} tone="good" />
        <Stat label="This week" value={formatCurrency(cur.week)} />
        <Stat label="This month" value={formatCurrency(cur.month)} />
        <Stat label="Total revenue" value={formatCurrency(cur.total)} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Avg order value" value={formatCurrency(cur.aov)} />
        <Stat label="Total orders" value={String(data.orders.total)} />
        <Stat label="Paid orders" value={String(data.orders.paid)} tone="good" />
        <Stat label="Pending" value={String(data.orders.pending)} tone="warn" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Revenue by source" className="lg:col-span-2">
          {data.traffic.length ? (
            <BarChart data={data.traffic.map((t: any) => ({ label: t.source, value: t.visitors }))} />
          ) : (
            <p className="py-6 text-center text-sm text-admin-muted">No traffic recorded yet.</p>
          )}
        </Card>
        <Card title="Conversion funnel">
          <dl className="space-y-4">
            {[
              ["Visitor → Checkout", data.conversions.visitorToCheckout],
              ["Checkout → Payment", data.conversions.checkoutToPayment],
              ["Payment → Purchase", data.conversions.paymentToPurchase],
              ["Overall conversion", data.conversions.overall],
            ].map(([l, v]) => (
              <div key={l as string}>
                <div className="flex justify-between text-sm"><span className="text-admin-muted">{l}</span><span className="font-semibold text-admin-ink">{v}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-gold-500" style={{ width: `${v}%` }} /></div>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent orders" action={<Link href="/admin/orders" className="text-xs text-gold-600 hover:underline">View all</Link>}>
          <div className="divide-y divide-admin-border">
            {data.recentOrders.map((o: any) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-admin-ink">{o.orderNumber}</p>
                  <p className="truncate text-xs text-admin-muted">{o.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatCurrency(o.amount)}</span>
                  <StatusPill status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
        <Card title="Customers" action={<Link href="/admin/customers" className="text-xs text-gold-600 hover:underline">View all</Link>}>
          <div className="divide-y divide-admin-border">
            {data.recentCustomers.map((c: any) => (
              <Link key={c.id} href={`/admin/customers/${c.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-admin-ink">{c.name}</p>
                  <p className="truncate text-xs text-admin-muted">{c.email}</p>
                </div>
                <span className="text-xs text-admin-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
