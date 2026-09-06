"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, Field, Input, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";
import { usePermission } from "@/components/admin/PermissionProvider";

export function AdminUsersClient() {
  const { can } = usePermission();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState(false);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const [ua, ra] = await Promise.all([
      fetch("/api/admin/users", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/roles", { cache: "no-store" }).then((r) => r.json()),
    ]);
    if (ua.ok) setUsers(ua.users);
    if (ra.ok) setRoles(ra.roles);
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function act(id: string, action: string, extra?: object) {
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id, ...extra }) });
    const d = await r.json();
    toast(d.ok ? "Done." : (d.error || "Failed."), d.ok ? "success" : "error");
    load();
  }

  if (loading) return <LoadingState />;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Admin Users</h1>
          <p className="text-sm text-admin-muted">Manage who can access the dashboard.</p>
        </div>
        {can("admin:manage") && <Button onClick={() => setNewUser(true)}>+ New admin</Button>}
      </div>
      <Card>
        {users.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-admin-border text-left text-xs uppercase text-admin-muted">
                <th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">MFA</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Last login</th><th className="px-3 py-2"></th>
              </tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-admin-border last:border-0">
                    <td className="px-3 py-2 font-medium">{u.name}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">{u.role?.name || "—"}</td>
                    <td className="px-3 py-2"><StatusPill status={u.mfaEnabled ? "active" : "disabled"} /></td>
                    <td className="px-3 py-2"><StatusPill status={u.isActive ? "active" : "disabled"} /></td>
                    <td className="px-3 py-2 text-admin-muted">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}</td>
                    <td className="px-3 py-2">
                      {can("admin:manage") && (
                        <div className="flex gap-1">
                          <select className="rounded border border-admin-border px-2 py-1 text-xs" defaultValue={u.isActive ? "1" : "0"} onChange={(e) => act(u.id, "toggleActive", { isActive: e.target.value === "1" })}><option value="1">Active</option><option value="0">Disable</option></select>
                          <Button variant="ghost" onClick={() => { const pw = prompt("New password:"); if (pw) act(u.id, "resetPassword", { password: pw }); }}>Reset</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-admin-muted">No admin users.</p>}
      </Card>
      {newUser && <NewUserModal roles={roles} onClose={() => setNewUser(false)} onCb={() => { setNewUser(false); load(); }} />}
    </div>
  );
}

function NewUserModal({ roles, onClose, onCb }: { roles: any[]; onClose: () => void; onCb: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: gen(), roleId: roles[0]?.id || "" });
  const [busy, setBusy] = useState(false);

  function gen() { const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%"; return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", ...form }) });
    const d = await r.json();
    setBusy(false);
    if (!d.ok) { toast(d.error || "Could not create.", "error"); return; }
    toast(`Admin created. Password: ${form.password}`);
    onCb();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-admin-border bg-white p-6 shadow-xl">
        <h2 className="font-serif text-xl font-semibold text-admin-ink">New admin</h2>
        <div className="mt-4 space-y-3">
          <Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Password"><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><div className="flex justify-end"><Button type="button" variant="ghost" onClick={() => setForm({ ...form, password: gen() })}>Generate</Button></div></Field>
          <Field label="Role"><select className="w-full rounded-lg border border-admin-border px-3 py-2 text-sm" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create"}</Button></div>
      </form>
    </div>
  );
}
