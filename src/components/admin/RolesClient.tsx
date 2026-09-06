"use client";

import { useEffect, useState } from "react";
import { Card, StatusPill, Button, LoadingState, ErrorState } from "@/components/admin/ui";
import { useToast } from "@/components/admin/ToastProvider";
import { usePermission } from "@/components/admin/PermissionProvider";

export function RolesClient() {
  const { can } = usePermission();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/roles", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) { setRoles(d.roles); setPermissions(d.permissions); setSelected((s) => s ?? d.roles[0]?.id ?? null); } else toast("Could not load.", "error");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function savePermissionKeys(id: string, keys: string[]) {
    const r = await fetch("/api/admin/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, permissionKeys: keys }) });
    const d = await r.json();
    toast(d.ok ? "Permissions saved." : (d.error || "Failed."), d.ok ? "success" : "error");
    load();
  }

  if (loading) return <LoadingState />;
  const role = roles.find((r) => r.id === selected);
  const categories = Array.from(new Set(permissions.map((p) => p.category)));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-admin-ink">Roles &amp; Permissions</h1>
        <p className="text-sm text-admin-muted">Fine-grained access control. Super Admin bypasses all checks and cannot be edited.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-1">
          {roles.map((r) => (
            <button key={r.id} onClick={() => setSelected(r.id)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selected === r.id ? "bg-gold-600 text-white" : "bg-gray-100 text-admin-ink hover:bg-gray-200"}`}>
              <span>{r.name}</span>
              <span className="flex items-center gap-2"><span className="text-xs opacity-80">{r._count.users} users</span><StatusPill status={r.isSuperRole ? "active" : "published"} /></span>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2">
          {role && <RoleEditor key={role.id} role={role} categories={categories} permissions={permissions} canManage={can("admin:manage")} onSave={savePermissionKeys} />}
        </div>
      </div>
    </div>
  );
}

function RoleEditor({ role, categories, permissions, canManage, onSave }: { role: any; categories: string[]; permissions: any[]; canManage: boolean; onSave: (id: string, keys: string[]) => void }) {
  const [keys, setKeys] = useState<string[]>(role.permissionKeys || []);
  const locked = role.isSuperRole || !canManage;

  function toggle(k: string) {
    setKeys((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);
  }

  return (
    <Card title={role.name} action={role.isSuperRole && <StatusPill status="active" />}>
      <p className="mb-3 text-sm text-admin-muted">{role.description}</p>
      {locked && role.isSuperRole && <p className="mb-3 text-xs text-gold-700">Super Admin has unrestricted access and cannot be edited.</p>}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="mb-1 text-xs font-semibold uppercase text-admin-muted">{cat}</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {permissions.filter((p) => p.category === cat).map((p) => (
                <label key={p.key} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${keys.includes(p.key) ? "border-gold-300 bg-gold-50/40" : "border-admin-border"} ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                  <input type="checkbox" disabled={locked} checked={keys.includes(p.key)} onChange={() => toggle(p.key)} />
                  <span className="flex-1">{p.label}</span>
                  <span className="font-mono text-[10px] text-admin-muted">{p.key}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        {!locked && <div className="flex justify-end"><Button onClick={() => onSave(role.id, keys)}>Save permissions</Button></div>}
      </div>
    </Card>
  );
}
