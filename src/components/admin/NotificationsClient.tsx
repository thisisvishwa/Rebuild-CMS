"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, StatusPill, Button, LoadingState, ErrorState } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/components/admin/ToastProvider";

export function NotificationsClient() {
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/notifications", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) { setItems(d.notifications); setUnread(d.unread); } else setError("Could not load notifications.");
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "markRead", id }) });
    load();
  }
  async function markAll() {
    await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "markAllRead" }) });
    toast("All marked read.");
    load();
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState title="Couldn't load notifications" body={error} retry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-admin-ink">Notifications</h1>
          <p className="text-sm text-admin-muted">{unread ? `${unread} unread` : "All caught up"}</p>
        </div>
        {unread > 0 && <Button variant="outline" onClick={markAll}>Mark all read</Button>}
      </div>
      <Card>
        {items.length ? (
          <div className="divide-y divide-admin-border">
            {items.map((n) => (
              <div key={n.id} className={`flex items-start justify-between gap-4 py-3 ${!n.read ? "bg-gold-50/30" : ""}`}>
                <div>
                  <div className="flex items-center gap-2"><StatusPill status={n.type} /><p className="font-medium text-admin-ink">{n.title}</p>{!n.read && <span className="h-2 w-2 rounded-full bg-gold-600" />}</div>
                  {n.body && <p className="mt-1 text-sm text-admin-muted">{n.body}</p>}
                  <p className="mt-1 text-xs text-admin-muted">{formatDateTime(n.createdAt)}</p>
                </div>
                <div className="flex gap-2">{n.link && <Link href={n.link} className="text-sm text-gold-600 hover:underline">View</Link>}{!n.read && <Button variant="ghost" onClick={() => markRead(n.id)}>Mark read</Button>}</div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-admin-muted">No notifications yet.</p>}
      </Card>
    </div>
  );
}
