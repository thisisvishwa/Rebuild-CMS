"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Input, Button, EmptyState, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";

export function CustomersClient() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [page]);

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/customers?page=${page}&per=16&q=${q}`, { cache: "no-store" });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error);
      setItems(d.items); setTotal(d.total);
    } catch { setError("Could not load customers."); }
    finally { setLoading(false); }
  }
  const pages = Math.max(1, Math.ceil(total / 16));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-admin-ink">Customers</h1>
        <p className="text-sm text-admin-muted">{total} total</p>
      </div>
      <Card>
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="flex gap-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="w-64" />
          <Button variant="outline" type="submit">Search</Button>
        </form>
      </Card>
      {error ? <ErrorState title="Couldn't load" body={error} retry={load} /> :
        loading ? <LoadingState /> :
        items.length === 0 ? <EmptyState title="No customers yet" body="Customers appear after their first order." /> :
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-admin-border text-left text-xs uppercase tracking-wide text-admin-muted">
                <th className="px-3 py-2">Customer</th><th className="px-3 py-2">Country</th>
                <th className="px-3 py-2">Orders</th><th className="px-3 py-2">Access</th>
                <th className="px-3 py-2">Downloads</th><th className="px-3 py-2">Joined</th>
              </tr></thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-2.5"><Link href={`/admin/customers/${c.id}`} className="font-medium text-gold-600 hover:underline">{c.name}</Link><p className="text-xs text-admin-muted">{c.email}</p></td>
                    <td className="px-3 py-2.5">{c.country || "—"}</td>
                    <td className="px-3 py-2.5">{c.orders}</td>
                    <td className="px-3 py-2.5">{c.entitlements}</td>
                    <td className="px-3 py-2.5">{c.downloads}</td>
                    <td className="px-3 py-2.5 text-admin-muted">{formatDateTime(c.createdAt)}</td>
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
