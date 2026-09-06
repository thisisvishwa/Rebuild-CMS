"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Exposes the current admin's RBAC permissions to client components so they can
 * conditionally render actions (buttons, forms, tabs) without server round-trips.
 */
const Ctx = createContext<{ isSuper: boolean; permissions: Set<string> }>({
  isSuper: false,
  permissions: new Set(),
});

export function PermissionProvider({ isSuper, permissions, children }: { isSuper: boolean; permissions: string[]; children: ReactNode }) {
  return (
    <Ctx.Provider value={{ isSuper, permissions: new Set(permissions) }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePermission() {
  const ctx = useContext(Ctx);
  return {
    isSuper: ctx.isSuper,
    can: (perm: string) => ctx.isSuper || ctx.permissions.has(perm),
  };
}
