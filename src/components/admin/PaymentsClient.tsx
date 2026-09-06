"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Field, Input, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatCurrency, formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";
import { usePermission } from "@/components/admin/PermissionProvider";

export function PaymentsClient() {
  const { can } = usePermission();
  const [payments, setPayments] = useState<any[]>([]);
  const [capturedTotal, setCapturedTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [refund, setRefund] = useState<any>(null);
  const { toast } = useToast();

  async function load(query = q) {
    setLoading(true);
    const r = await fetch(`/api/admin/payments?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    const d = await r.json();
    if (d.ok) { setPayments(d.payments); setCapturedTotal(d.capturedTotalMinor); } else toast("Could not load.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(""); }, []);

  if (loading) return <LoadingState />;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Payments</h1>
          <p className="text-sm text-admin-muted">Captured total: <span className="font-semibold text-admin-ink">{formatCurrency(capturedTotal)}</span></p>
        </div>
        <div className="flex gap-2"><Input placeholder="Search order / transaction" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="w-64" /><Button variant="outline" onClick={() => load()}>Search</Button></div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-admin-border text-left text-xs uppercase text-admin-muted">
              <th className="px-3 py-2">Order</th><th className="px-3 py-2">Provider</th><th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th><th className="px-3 py-2">Method</th><th className="px-3 py-2">Date</th><th className="px-3 py-2"></th>
            </tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-admin-border last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{p.order?.orderNumber}</td>
                  <td className="px-3 py-2 capitalize">{p.provider}</td>
                  <td className="px-3 py-2 font-medium">{formatCurrency(p.amountMinor, p.currency)}</td>
                  <td className="px-3 py-2"><StatusPill status={p.status} /></td>
                  <td className="px-3 py-2">{p.method || "—"}</td>
                  <td className="px-3 py-2 text-admin-muted">{formatDateTime(p.createdAt)}</td>
                  <td className="px-3 py-2">{can("payments:refund") && p.status === "captured" && <Button variant="outline" onClick={() => setRefund(p)}>Refund</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {refund && <RefundModal payment={refund} onClose={() => setRefund(null)} onCb={() => { setRefund(null); load(); }} />}
    </div>
  );
}

function RefundModal({ payment, onClose, onCb }: { payment: any; onClose: () => void; onCb: () => void }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(payment.amountMinor);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch(`/api/admin/payments/${payment.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountMinor: Number(amount), reason }) });
    const d = await r.json();
    setBusy(false);
    if (!d.ok) { toast(d.error || "Refund failed.", "error"); return; }
    toast("Refund processed.");
    onCb();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-admin-border bg-white p-6 shadow-xl">
        <h2 className="font-serif text-xl font-semibold text-admin-ink">Refund {formatCurrency(payment.amountMinor, payment.currency)}</h2>
        <p className="mt-1 text-sm text-admin-muted">{payment.order?.orderNumber} · {payment.provider}</p>
        <div className="mt-4 space-y-3">
          <Field label="Amount (minor units)"><Input required type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field>
          <Field label="Reason"><Input required value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Processing…" : "Refund"}</Button></div>
      </form>
    </div>
  );
}
