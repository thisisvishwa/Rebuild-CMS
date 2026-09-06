"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Field, Input, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatCurrency, formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";

export function CouponsClient() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<any>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/coupons", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setCoupons(d.coupons); else setError("Could not load coupons.");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    const r = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
    const d = await r.json();
    toast(d.ok ? (d.archived ? "Coupon archived." : "Coupon deleted.") : (d.error || "Failed."), d.ok ? "success" : "error");
    load();
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title="Couldn't load coupons" body={error} retry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Coupons</h1>
          <p className="text-sm text-admin-muted">Discount codes applied at checkout.</p>
        </div>
        <Button onClick={() => setEditor({})}>+ New coupon</Button>
      </div>
      <Card>
        {coupons.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-admin-border text-left text-xs uppercase text-admin-muted">
                <th className="px-3 py-2">Code</th><th className="px-3 py-2">Discount</th><th className="px-3 py-2">Orders</th>
                <th className="px-3 py-2">Expires</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"></th>
              </tr></thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-admin-border last:border-0">
                    <td className="px-3 py-2 font-mono text-xs font-semibold">{c.code}</td>
                    <td className="px-3 py-2">{c.type === "percent" ? `${c.value}%` : formatCurrency(c.value)}</td>
                    <td className="px-3 py-2">{c._count.orders}</td>
                    <td className="px-3 py-2 text-admin-muted">{c.expiresAt ? formatDateTime(c.expiresAt) : "Never"}</td>
                    <td className="px-3 py-2"><StatusPill status={c.isActive ? "active" : "disabled"} /></td>
                    <td className="px-3 py-2 flex gap-2">
                      <Button variant="outline" onClick={() => setEditor(c)}>Edit</Button>
                      <Button variant="ghost" onClick={() => remove(c.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-admin-muted">No coupons yet.</p>}
      </Card>
      {editor !== null && <CouponEditor coupon={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} />}
    </div>
  );
}

function CouponEditor({ coupon, onClose, onSaved }: { coupon: any; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    id: coupon.id || undefined,
    code: coupon.code || "",
    type: coupon.type || "percent",
    value: coupon.value || 10,
    isActive: coupon.isActive !== false,
    usageLimit: coupon.usageLimit || "",
    perCustomerLimit: coupon.perCustomerLimit || "",
    minOrderMinor: coupon.minOrderMinor || "",
    expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      ...form,
      value: Number(form.value),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perCustomerLimit: form.perCustomerLimit ? Number(form.perCustomerLimit) : null,
      minOrderMinor: form.minOrderMinor ? Number(form.minOrderMinor) : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    }) });
    const d = await r.json();
    setBusy(false);
    if (!d.ok) { toast(d.error || "Could not save.", "error"); return; }
    toast("Coupon saved.");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-admin-border bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-admin-ink">{coupon.id ? "Edit coupon" : "New coupon"}</h2>
          <button type="button" onClick={onClose} className="text-admin-muted hover:text-admin-ink">✕</button>
        </div>
        <div className="mt-4 space-y-3">
          <Field label="Code"><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE10" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type"><select className="w-full rounded-lg border border-admin-border px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="percent">Percent</option><option value="fixed">Fixed</option></select></Field>
            <Field label="Value">{form.type === "percent" ? "(%)" : "(minor units)"}<Input required type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Usage limit"><Input type="number" value={form.usageLimit as any} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" /></Field>
            <Field label="Per-customer limit"><Input type="number" value={form.perCustomerLimit as any} onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })} placeholder="Unlimited" /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Min order (minor)"><Input type="number" value={form.minOrderMinor as any} onChange={(e) => setForm({ ...form, minOrderMinor: e.target.value })} placeholder="0" /></Field>
            <Field label="Expires"><Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button></div>
      </form>
    </div>
  );
}
