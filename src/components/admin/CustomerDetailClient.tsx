"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, StatusPill, Button, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatCurrency, formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";

export function CustomerDetailClient({ id }: { id: string }) {
  const [c, setC] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/admin/customers/${id}`, { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setC(d.customer); else setError("Customer not found.");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function action(a: string, extra?: object) {
    const r = await fetch(`/api/admin/customers/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: a, ...extra }) });
    const d = await r.json();
    if (d.ok) { toast("Done."); load(); } else toast(d.error || "Action failed.", "error");
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title={error} retry={load} />;
  if (!c) return null;

  const totalSpent = c.orders.filter((o: any) => o.status === "paid").reduce((s: number, o: any) => s + o.amountMinor, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/customers" className="text-sm text-admin-muted hover:underline">← Customers</Link>
        <h1 className="font-serif text-2xl font-semibold text-admin-ink">{c.name}</h1>
        <span className="text-sm text-admin-muted">{c.email}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Summary">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-admin-muted">Country</dt><dd>{c.country || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-admin-muted">Orders</dt><dd>{c.orders.length}</dd></div>
            <div className="flex justify-between"><dt className="text-admin-muted">Total spent</dt><dd className="font-semibold">{formatCurrency(totalSpent)}</dd></div>
            <div className="flex justify-between"><dt className="text-admin-muted">Joined</dt><dd>{formatDateTime(c.createdAt)}</dd></div>
          </dl>
        </Card>
        <Card title="Entitlements">
          {c.entitlements.length ? c.entitlements.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between border-b border-admin-border py-2 text-sm last:border-0">
              <div><p className="font-medium">{e.product?.name ?? "Product"}</p><p className="text-xs text-admin-muted">Version {e.version?.version ?? "latest"}</p></div>
              <div className="flex items-center gap-2">
                <StatusPill status={e.status} />
                <Button variant="outline" onClick={() => { if (e.status === "active") action("revoke_access", { entitlementId: e.id }); else action("restore_access", { entitlementId: e.id }); }}>{e.status === "active" ? "Revoke" : "Restore"}</Button>
              </div>
            </div>
          )) : <p className="text-sm text-admin-muted">No entitlements.</p>}
        </Card>
        <Card title="Internal note">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded-lg border border-admin-border px-3 py-2 text-sm" placeholder="Private admin note…" />
          <div className="mt-2 flex justify-end"><Button variant="outline" onClick={() => { if (note) action("note", { note }); setNote(""); }}>Save note</Button></div>
          <div className="mt-3 space-y-2">
            {c.notes.slice(0, 6).map((n: any) => (
              <div key={n.id} className="text-sm"><p className="rounded bg-gray-50 px-3 py-2">{n.note}</p><p className="mt-0.5 text-xs text-admin-muted">{formatDateTime(n.createdAt)}</p></div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Orders">
        {c.orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-admin-border text-left text-xs uppercase text-admin-muted">
                <th className="px-3 py-2">Order</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Date</th>
              </tr></thead>
              <tbody>
                {c.orders.map((o: any) => (
                  <tr key={o.id} className="border-b border-admin-border last:border-0">
                    <td className="px-3 py-2"><Link href={`/admin/orders/${o.id}`} className="text-gold-600 hover:underline">{o.orderNumber}</Link></td>
                    <td className="px-3 py-2">{formatCurrency(o.amountMinor, o.currency)}</td>
                    <td className="px-3 py-2"><StatusPill status={o.status} /></td>
                    <td className="px-3 py-2 text-admin-muted">{formatDateTime(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-admin-muted">No orders.</p>}
      </Card>

      <Card title="Activity">
        {c.customerEvents.length ? (
          <ul className="space-y-2 text-sm">
            {c.customerEvents.map((e: any) => (
              <li key={e.id} className="flex items-center justify-between"><span>{e.type}</span><span className="text-xs text-admin-muted">{formatDateTime(e.createdAt)}</span></li>
            ))}
          </ul>
        ) : <p className="text-sm text-admin-muted">No activity.</p>}
      </Card>
    </div>
  );
}
