"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, KeyRound } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfa, setMfa] = useState(false);
  const [code, setCode] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      if (data.mfaRequired) {
        setMfa(true);
        setLoading(false);
        return;
      }
      router.push(data.redirect || "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  }

  async function verifyMfa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      router.push(data.redirect || "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={mfa ? verifyMfa : submit} className="mt-6 space-y-4">
      {mfa ? (
        <>
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs text-sky-700">
            Two-factor authentication required. Open your authenticator app and enter the code.
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              autoFocus
              className="w-full rounded-lg border border-admin-border py-2.5 pl-9 pr-3 text-center text-lg tracking-[0.5em] outline-none focus:border-charcoal-400"
            />
          </div>
        </>
      ) : (
        <>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="username"
              className="w-full rounded-lg border border-admin-border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-100"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-admin-border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-charcoal-400 focus:ring-2 focus:ring-charcoal-100"
            />
          </div>
        </>
      )}

      {error && <p className="rounded-lg border border-clay-200 bg-clay-100 px-3 py-2 text-xs text-clay-500">{error}</p>}

      <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-admin-ink py-2.5 text-sm font-medium text-white hover:bg-admin-ink/90 disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mfa ? "Verify" : "Sign in"}
        {!loading && <KeyRound className="h-4 w-4" />}
      </button>
    </form>
  );
}
