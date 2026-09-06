"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Input, Select, StatusPill, Button, EmptyState, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatCurrency, formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";

const STATUSES = ["", "paid", "pending", "pending_verification", "failed", "cancelled", "refunded"];

export function OrdersClient() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [page, status]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/orders?page=${page}&per=16&status=${status}&q=${q}`, { cache: "no-store" });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error);
      setItems(d.items);
      setTotal(d.total);
    } catch (e) {
      setError("Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  const pages = Math.max(1, Math.ceil(total / 16));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Orders</h1>
          <p className="text-sm text-admin-muted">{total} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreate((v) => !v)}>+ Manual order</Button>
          <Link href="/admin/invoices" className="inline-flex items-center rounded-lg border border-admin-border bg-white px-4 py-2 text-sm font-medium text-admin-ink hover:bg-gray-50">Invoices</Link>
        </div>
      </div>

      <Card>
        <form onSubmit={search} className="flex flex-wrap items-center gap-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order no, email, name…" className="w-64" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-44">
            {STATUSES.map((s) => <option key={s} value={s}>{s === "" ? "All statuses" : s.replace("_", " ")}</option>)}
          </Select>
          <Button type="submit" variant="outline">Search</Button>
        </form>
      </Card>

      {showCreate && <ManualOrderForm onDone={() => { setShowCreate(false); setPage(1); load(); }} />}

      {error ? <ErrorState title="Couldn't load orders" body={error} retry={load} /> :
        loading ? <LoadingState /> :
        items.length === 0 ? <EmptyState title="No orders found" body="Orders will appear here as customers check out." /> :
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border text-left text-xs uppercase tracking-wide text-admin-muted">
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-2.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-medium text-gold-600 hover:underline">{o.orderNumber}</Link>
                    </td>
                    <td className="px-3 py-2.5"><p className="font-medium">{o.name}</p><p className="text-xs text-admin-muted">{o.email}</p></td>
                    <td className="px-3 py-2.5 font-medium">{formatCurrency(o.amountMinor, o.currency)}</td>
                    <td className="px-3 py-2.5">{o.method}</td>
                    <td className="px-3 py-2.5"><StatusPill status={o.status} /></td>
                    <td className="px-3 py-2.5 text-admin-muted">{formatDateTime(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-3 py-3">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <span className="text-xs text-admin-muted">Page {page} of {pages}</span>
            <Button variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </Card>}
    </div>
  );
}

function ManualOrderForm({ onDone }: { onDone: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", amountMinor: 4900, currency: "USD", status: "paid", reason: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    setBusy(false);
    if (!d.ok) { toast(d.error || "Could not create order.", "error"); return; }
    toast("Manual order created.");
    onDone();
  }

  return (
    <Card title="Create manual order" action={<button onClick={onDone} className="text-xs text-admin-muted hover:underline">✕</button>}>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input placeholder="Customer name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-admin-border px-3 py-2 text-sm" />
        <input placeholder="Email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-admin-border px-3 py-2 text-sm" />
        <input placeholder="Amount (minor units)" required type="number" value={form.amountMinor} onChange={(e) => setForm({ ...form, amountMinor: Number(e.target.value) })} className="rounded-lg border border-admin-border px-3 py-2 text-sm" />
        <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="rounded-lg border border-admin-border px-3 py-2 text-sm">
          <option value="USD">USD</option><option value="INR">INR</option>
        </select>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-lg border border-admin-border px-3 py-2 text-sm">
          <option value="paid">Paid</option><option value="pending">Pending</option>
        </select>
        <input placeholder="Reason (required)" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="rounded-lg border border-admin-border px-3 py-2 text-sm" />
        <div className="sm:col-span-2 flex items-center gap-2">
          <span className="rounded bg-gold-100 px-2 py-0.5 text-xs font-semibold text-gold-700">MANUAL ORDER</span>
          <Button type="submit" disabled={busy} className="ml-auto">{busy ? "Creating…" : "Create order"}</Button>
        </div>
      </form>
    </Card>
  );
}
