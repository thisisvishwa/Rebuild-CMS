import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/admin/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Admin Login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const ctx = await getAuthContext();
  if (ctx) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-admin-border bg-white p-8 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500 text-lg font-bold text-white">R</span>
            <div>
              <h1 className="font-serif text-xl font-semibold text-admin-ink">Rebuild Admin</h1>
              <p className="text-xs text-admin-muted">Ebook business control center</p>
            </div>
          </div>
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-admin-muted">
          Secure, role-based access. Login attempts are rate limited.
        </p>
      </div>
    </div>
  );
}
