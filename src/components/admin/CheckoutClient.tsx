"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Stat, StatusPill, Badge, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/admin/format";

export function CheckoutClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await fetch("/api/admin/checkout", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setData(d);
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState title="Couldn't load checkout" retry={load} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-admin-ink">Checkout</h1>
        <p className="text-sm text-admin-muted">Live checkout configuration and abandoned-payment state.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Payment mode" value={data.config.paymentMode === "demo" ? "Demo (simulated)" : "Live"} tone={data.config.paymentMode === "live" ? "good" : "warn"} />
        <Stat label="Paid orders" value={String(data.stats.paidOrders)} />
        <Stat label="Abandoned / pending" value={String(data.stats.abandonedOrders)} tone="warn" />
      </div>

      <Card title="Product & pricing (single source of truth)">
        <div className="space-y-2 text-sm">
          <p className="flex justify-between"><span className="text-admin-muted">Product</span><span>{data.config.productName}</span></p>
          <p className="flex justify-between"><span className="text-admin-muted">Price</span><span className="font-semibold">{formatCurrency(data.config.priceMinor, data.config.currency)}</span></p>
          <p className="flex justify-between"><span className="text-admin-muted">Tax enabled</span><span>{data.config.taxEnabled ? "Yes" : "No"}</span></p>
        </div>
        <p className="mt-3 text-xs text-admin-muted">Price is edited in <Link href="/admin/settings" className="text-gold-600 hover:underline">Settings</Link> and validated server-side; the front end never sets the price.</p>
      </Card>

      <Card title="Payment providers">
        <div className="grid gap-3 sm:grid-cols-3">
          {data.config.providers.map((p: any) => (
            <Link key={p.key} href="/admin/payment-providers" className="rounded-xl border border-admin-border p-3 hover:border-gold-400">
              <div className="flex items-center justify-between"><span className="font-medium text-admin-ink">{p.name}</span><StatusPill status={p.enabled ? "active" : "disabled"} /></div>
              <p className="mt-2 text-xs text-admin-muted">Shows on checkout: <Badge tone={p.showOnCheckout ? "good" : "neutral"}>{p.showOnCheckout ? "Yes" : "No"}</Badge></p>
              <p className="mt-1 text-xs capitalize text-admin-muted">{p.environment}</p>
            </Link>
          ))}
        </div>
        {data.config.paymentMode === "live" && <p className="mt-3 text-xs text-gold-700">Live mode is on — payments are real. Ensure all providers have live credentials set.</p>}
      </Card>
    </div>
  );
}
