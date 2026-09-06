"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Input, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatCurrency, formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";
import { usePermission } from "@/components/admin/PermissionProvider";

export function InvoicesClient() {
  const { can } = usePermission();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function load(query = q) {
    setLoading(true);
    const r = await fetch(`/api/admin/invoices?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setInvoices(d.invoices); else toast("Could not load.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(""); }, []);

  async function act(id: string, action: string) {
    const r = await fetch(`/api/admin/invoices?id=${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const d = await r.json();
    toast(d.ok ? "Updated." : (d.error || "Failed."), d.ok ? "success" : "error");
    load();
  }

  if (loading) return <LoadingState />;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Invoices</h1>
          <p className="text-sm text-admin-muted">Auto-numbered invoices are issued on payment.</p>
        </div>
        <div className="flex gap-2"><Input placeholder="Search invoice / order / customer" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="w-72" /><Button variant="outline" onClick={() => load()}>Search</Button></div>
      </div>
      <Card>
        {invoices.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-admin-border text-left text-xs uppercase text-admin-muted">
                <th className="px-3 py-2">Invoice</th><th className="px-3 py-2">Order</th><th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Total</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Date</th><th className="px-3 py-2"></th>
              </tr></thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id} className="border-b border-admin-border last:border-0">
                    <td className="px-3 py-2 font-mono text-xs font-semibold">{i.number}</td>
                    <td className="px-3 py-2 font-mono text-xs">{i.order?.orderNumber}</td>
                    <td className="px-3 py-2">{i.customer?.email}</td>
                    <td className="px-3 py-2 font-medium">{formatCurrency(i.totalMinor, i.currency)}</td>
                    <td className="px-3 py-2"><StatusPill status={i.status} /></td>
                    <td className="px-3 py-2"><StatusPill status={i.emailStatus === "sent" ? "sent" : "queued"} /></td>
                    <td className="px-3 py-2 text-admin-muted">{formatDateTime(i.issuedAt)}</td>
                    <td className="px-3 py-2 flex gap-1">
                      {can("invoices:manage") && <Button variant="outline" onClick={() => act(i.id, "resend")}>Resend</Button>}
                      {can("invoices:manage") && i.status !== "paid" && <Button variant="ghost" onClick={() => act(i.id, "markPaid")}>Mark paid</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-admin-muted">No invoices yet.</p>}
      </Card>
    </div>
  );
}
