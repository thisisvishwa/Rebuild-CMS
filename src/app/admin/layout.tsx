import { requireAuth } from "@/lib/admin/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/ToastProvider";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PermissionProvider } from "@/components/admin/PermissionProvider";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let ctx;
  try {
    ctx = await requireAuth();
  } catch {
    redirect("/admin/login");
  }

  return (
    <ToastProvider>
      <PermissionProvider isSuper={Boolean(ctx.isSuper)} permissions={Array.from(ctx.permissions)}>
        <div className="min-h-screen bg-admin-bg text-admin-ink">
          <Sidebar
            items={ADMIN_NAV}
            permissions={ctx.permissions}
            isSuper={ctx.isSuper}
            userName={ctx.user.name}
            userEmail={ctx.user.email}
          />
          <div className="md:pl-64">
            <AdminHeader
              name={ctx.user.name}
              role={ctx.role?.name ?? "Super Admin"}
              searchPlaceholder="Search orders, customers, payments…"
            />
            <main className="px-4 py-6 md:px-8">{children}</main>
          </div>
        </div>
      </PermissionProvider>
    </ToastProvider>
  );
}
