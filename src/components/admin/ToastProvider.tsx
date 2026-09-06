"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToastState {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface Ctx {
  toast: (message: string, type?: ToastState["type"]) => void;
}

const ToastCtx = createContext<Ctx>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const toast = useCallback((message: string, type: ToastState["type"] = "success") => {
    const id = ++counter;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "min-w-[260px] max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg",
              t.type === "success" && "border-sage-200 bg-white text-sage-600",
              t.type === "error" && "border-clay-200 bg-white text-clay-500",
              t.type === "info" && "border-sky-200 bg-white text-sky-700",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
