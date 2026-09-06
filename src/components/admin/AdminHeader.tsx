"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, ArrowUpRight } from "lucide-react";
import { useToast } from "@/components/admin/ToastProvider";
import { ADMIN_NAV } from "@/lib/admin/nav";

export function AdminHeader({
  name,
  role,
  searchPlaceholder,
}: {
  name: string;
  role: string;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ label: string; href: string }[]>([]);
  const [searching, setSearching] = useState(false);

  // Breadcrumb from nav structure.
  const current = ADMIN_NAV.find((n) => pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href)));

  async function runSearch(value: string) {
    setQ(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setSearching(false);
    }
  }

  function go(href: string) {
    setResults([]);
    setQ("");
    router.push(href);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-admin-border bg-admin-panel/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 md:px-8">
        <div className="hidden flex-col md:flex">
          <p className="text-xs text-admin-muted">Admin</p>
          <p className="text-sm font-semibold text-admin-ink">{current?.label ?? "Dashboard"}</p>
        </div>

        {/* Global search */}
        <div className="relative ml-auto w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
          <input
            value={q}
            onChange={(e) => runSearch(e.target.value)}
            placeholder={searchPlaceholder ?? "Search…"}
            className="w-full rounded-lg border border-admin-border bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-100"
          />
          {searching && <span className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-admin-border border-t-admin-ink" />}
          {results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-y-auto rounded-lg border border-admin-border bg-white shadow-lg">
              {results.map((r, i) => (
                <button key={i} onClick={() => go(r.href)} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-gray-50">
                  {r.label}
                  <ArrowUpRight className="h-3.5 w-3.5 text-admin-muted" />
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => toast("You're all caught up.", "info")} className="relative rounded-lg p-2 text-admin-muted hover:bg-gray-100" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-clay-500" />
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-admin-border bg-white px-3 py-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="hidden text-sm sm:block">
            <span className="font-medium text-admin-ink">{name}</span>
            <span className="block text-xs text-admin-muted">{role}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
