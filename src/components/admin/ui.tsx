"use client";

import { cn } from "@/lib/utils";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

// --- Stat card -------------------------------------------------------------
export function Stat({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: string; tone?: "default" | "good" | "warn" | "bad" }) {
  const toneCls =
    tone === "good" ? "text-sage-600" :
    tone === "warn" ? "text-gold-600" :
    tone === "bad" ? "text-clay-500" :
    "text-admin-ink";
  return (
    <div className="rounded-2xl border border-admin-border bg-admin-panel p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">{label}</p>
      <p className={cn("mt-2 font-serif text-3xl font-semibold", toneCls)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-admin-muted">{sub}</p>}
    </div>
  );
}

// --- Badge ------------------------------------------------------------------
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "info" }) {
  const cls =
    tone === "good" ? "bg-sage-100 text-sage-600 border-sage-200" :
    tone === "warn" ? "bg-gold-100 text-gold-700 border-gold-200" :
    tone === "bad" ? "bg-clay-100 text-clay-500 border-clay-200" :
    tone === "info" ? "bg-sky-50 text-sky-700 border-sky-200" :
    "bg-gray-100 text-admin-muted border-gray-200";
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", cls)}>{children}</span>;
}

// --- Card --------------------------------------------------------------------
export function Card({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-admin-border bg-admin-panel shadow-sm", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-admin-border px-5 py-3.5">
          <h3 className="text-sm font-semibold text-admin-ink">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// --- Buttons -----------------------------------------------------------------
export function Button({ variant = "primary", className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "outline" }) {
  const cls =
    variant === "primary" ? "bg-admin-ink text-white hover:bg-admin-ink/90" :
    variant === "danger" ? "bg-clay-500 text-white hover:bg-clay-500/90" :
    variant === "outline" ? "border border-admin-border text-admin-ink hover:bg-gray-50" :
    "text-admin-muted hover:bg-gray-100 hover:text-admin-ink";
  return (
    <button className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed", cls, className)} {...rest}>
      {children}
    </button>
  );
}

// --- Inputs ------------------------------------------------------------------
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("w-full rounded-lg border border-admin-border bg-white px-3 py-2 text-sm text-admin-ink outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-100", className)} {...rest} />;
}
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("w-full rounded-lg border border-admin-border bg-white px-3 py-2 text-sm text-admin-ink outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-100", className)} {...rest} />;
}
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("w-full rounded-lg border border-admin-border bg-white px-3 py-2 text-sm text-admin-ink outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-100", className)} {...rest}>{children}</select>;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-admin-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-admin-muted">{hint}</span>}
    </label>
  );
}

// --- Status pill for order/payment status ---------------------------------
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: "good" | "warn" | "bad" | "info" | "neutral"; label: string }> = {
    paid: { tone: "good", label: "Paid" },
    pending: { tone: "warn", label: "Pending" },
    pending_verification: { tone: "warn", label: "Awaiting verification" },
    failed: { tone: "bad", label: "Failed" },
    cancelled: { tone: "neutral", label: "Cancelled" },
    refunded: { tone: "info", label: "Refunded" },
    active: { tone: "good", label: "Active" },
    revoked: { tone: "bad", label: "Revoked" },
    draft: { tone: "neutral", label: "Draft" },
    published: { tone: "good", label: "Published" },
    archived: { tone: "neutral", label: "Archived" },
    captured: { tone: "good", label: "Captured" },
    created: { tone: "info", label: "Created" },
    authorized: { tone: "info", label: "Authorized" },
    sent: { tone: "good", label: "Sent" },
    disabled: { tone: "neutral", label: "Disabled" },
    queued: { tone: "warn", label: "Queued" },
    unfinished: { tone: "warn", label: "Unfinished" },
    unpaid: { tone: "warn", label: "Unpaid" },
  };
  const m = map[status] ?? { tone: "neutral" as const, label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

// --- Toast -------------------------------------------------------------------
export type Toast = { id: number; message: string; type: "success" | "error" | "info" };

// --- Simple bar chart (SVG, no deps) ---------------------------------------
export function BarChart({ data, height = 160 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end" title={`${d.label}: ${d.value}`}>
          <div className="w-full rounded-t bg-admin-ink/80 transition-all hover:bg-admin-ink" style={{ height: `${(d.value / max) * 100}%` }} />
          <span className="mt-1 truncate text-[10px] text-admin-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// --- Loading/empty/error states --------------------------------------------
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-admin-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-admin-border border-t-admin-ink" />
      {label}
    </div>
  );
}
export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-admin-border py-12 text-center">
      <p className="text-sm font-semibold text-admin-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-xs text-admin-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function ErrorState({ title, body, retry }: { title: string; body?: string; retry?: () => void }) {
  return (
    <div className="rounded-xl border border-clay-200 bg-clay-100 px-4 py-3 text-sm text-clay-500">
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1">{body}</p>}
      {retry && <button onClick={retry} className="mt-2 underline">Retry</button>}
    </div>
  );
}
