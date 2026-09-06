"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard, FileText, Package, BookOpen, ShoppingCart, Users, Activity,
  ChartLine, Share2, CreditCard, Wallet, Server, Receipt, Mail, Download, Ticket,
  HelpCircle, MessageSquareQuote, Image as ImageIcon, Search, Scale, Bell,
  BadgeCheck, KeyRound, ShieldCheck, Webhook, ScrollText, History, HeartPulse,
  DatabaseBackup, Settings, Menu, X, LogOut, ChevronsUpDown,
} from "lucide-react";
import type { NavItem } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, FileText, Package, BookOpen, ShoppingCart, Users, Activity,
  ChartLine, Share2, CreditCard, Wallet, Server, Receipt, Mail, Download, Ticket,
  HelpCircle, MessageSquareQuote, Image: ImageIcon, Search, Scale, Bell,
  BadgeCheck, KeyRound, ShieldCheck, Webhook, ScrollText, History, HeartPulse,
  DatabaseBackup, Settings,
};

export function Sidebar({
  items,
  permissions,
  isSuper,
  userName,
  userEmail,
}: {
  items: NavItem[];
  permissions: Set<string>;
  isSuper: boolean;
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visible = items.filter((it) => isSuper || !it.perm || permissions.has(it.perm));

  const links = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
      {visible.map((item) => {
        const Icon = ICONS[item.icon ?? "FileText"] ?? FileText;
        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-admin-sidebar-hover text-white" : "text-admin-link hover:bg-admin-sidebar-hover hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
      <p className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-admin-link/50">Session</p>
      <button
        onClick={() => { window.location.href = "/api/admin/logout"; }}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-admin-link hover:bg-admin-sidebar-hover hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed left-3 top-3 z-[60] rounded-lg bg-admin-sidebar p-2 text-white md:hidden"
        aria-label="Toggle admin menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-admin-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500 text-sm font-bold text-white">R</span>
          <span className="font-serif text-lg font-semibold text-white">{userName.startsWith("The") ? "Rebuild" : "Rebuild"}</span>
        </div>
        {links}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-admin-sidebar">
            <div className="flex h-16 items-center gap-2 px-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500 text-sm font-bold text-white">R</span>
              <span className="font-serif text-lg font-semibold text-white">Rebuild</span>
              <button onClick={() => setOpen(false)} className="ml-auto text-admin-link" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            {links}
          </aside>
        </div>
      )}
    </>
  );
}
