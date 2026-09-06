"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, StatusPill, Button, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatCurrency, formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";

export function OrderDetailClient({ id }: { id: string }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/admin/orders/${id}`, { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setOrder(d.order); else setError("Order not found.");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function action(a: string, extra?: object) {
    const r = await fetch(`/api/admin/orders/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: a, ...extra }) });
    const d = await r.json();
    if (d.ok) { toast("Action complete."); load(); } else toast(d.error || "Action failed.", "error");
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title={error} retry={load} />;
  if (!order) return null;

  const c = order.customer;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="text-sm text-admin-muted hover:underline">← Orders</Link>
        <h1 className="font-serif text-2xl font-semibold text-admin-ink">{order.orderNumber}</h1>
        <StatusPill status={order.status} />
        {order.isManual && <span className="rounded bg-gold-100 px-2 py-0.5 text-xs font-semibold text-gold-700">MANUAL ORDER</span>}
      </div>

      {order.isManual && order.manualReason && (
        <div className="rounded-lg border border-gold-200 bg-gold-100 px-4 py-2 text-sm text-gold-700">Reason: {order.manualReason}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Order">
          <dl className="space-y-2 text-sm">
            <Row k="Amount" v={formatCurrency(order.amountMinor, order.currency)} />
            <Row k="Tax" v={formatCurrency(order.taxMinor, order.currency)} />
            <Row k="Discount" v={formatCurrency(order.discountMinor, order.currency)} />
            <Row k="Payment method" v={order.method} />
            <Row k="Date" v={formatDateTime(order.createdAt)} />
            <Row k="Access granted" v={order.accessGranted ? "Yes" : "No"} />
          </dl>
        </Card>
        <Card title="Customer">
          {c ? (
            <dl className="space-y-2 text-sm">
              <Row k="Name" v={c.name} />
              <Row k="Email" v={c.email} />
              <Row k="Country" v={c.country || "—"} />
              <div className="pt-1"><Link href={`/admin/customers/${c.id}`} className="text-sm text-gold-600 hover:underline">View customer →</Link></div>
            </dl>
          ) : (
            <p className="text-sm text-admin-muted">{order.name} · {order.email}</p>
          )}
        </Card>
        <Card title="Payment">
          {order.payments.length ? (
            <dl className="space-y-2 text-sm">
              {order.payments.map((p: any) => (
                <div key={p.id}>
                  <Row k="Provider" v={p.provider} />
                  <Row k="Ref" v={p.providerPaymentId || "—"} />
                  <Row k="Status" v={<StatusPill status={p.status} />} />
                  <Row k="Env" v={p.environment} />
                </div>
              ))}
            </dl>
          ) : <p className="text-sm text-admin-muted">No payment records.</p>}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Fulfillment">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => action("fulfill")}>Run fulfillment</Button>
            <Button variant="outline" onClick={() => action("resend_access")}>Resend access email</Button>
            <Button variant="outline" onClick={() => { if (confirm("Grant access to this order even if not paid?")) action("grant_access"); }}>Grant access</Button>
          </div>
          <div className="mt-4 border-t border-admin-border pt-4">
            <h4 className="text-xs font-semibold uppercase text-admin-muted">Entitlement</h4>
            {order.entitlements.length ? (
              order.entitlements.map((e: any) => (
                <div key={e.id} className="mt-2 flex items-center justify-between text-sm">
                  <span>Version {e.version?.version ?? "latest"}</span>
                  <StatusPill status={e.status} />
                </div>
              ))
            ) : <p className="mt-2 text-sm text-admin-muted">No entitlement issued.</p>}
          </div>
        </Card>
        <Card title="Internal note">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded-lg border border-admin-border px-3 py-2 text-sm" placeholder="Add an internal note (never shown to customer)" />
          <div className="mt-2 flex justify-end">
            <Button variant="outline" onClick={() => { if (note) action("note", { note }); setNote(""); }}>Save note</Button>
          </div>
          <div className="mt-3 space-y-2 border-t border-admin-border pt-3">
            {order.notes.slice(0, 6).map((n: any) => (
              <div key={n.id} className="text-sm">
                <p className="rounded bg-gray-50 px-3 py-2">{n.note}</p>
                <p className="mt-0.5 text-xs text-admin-muted">{formatDateTime(n.createdAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {order.invoice && (
        <Card title="Invoice" action={<Link href={`/admin/invoices`} className="text-xs text-gold-600 hover:underline">View invoices</Link>}>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">{order.invoice.number}</span>
            <StatusPill status={order.invoice.status} />
            <span className="text-admin-muted">{formatCurrency(order.invoice.totalMinor, order.invoice.currency)}</span>
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-admin-muted">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
