"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { uid } from "@/lib/utils";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
};

type ToastContextValue = {
  toast: (t: Omit<ToastItem, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((t: Omit<ToastItem, "id">) => {
    setItems((prev) => [...prev, { ...t, id: uid() }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4500}>
        {children}
        {items.map((it) => (
          <ToastPrimitive.Root
            key={it.id}
            onOpenChange={(open) =>
              !open && setItems((prev) => prev.filter((p) => p.id !== it.id))
            }
            className={cn(
              "pointer-events-auto relative grid grid-cols-[1fr_auto] items-start gap-3 rounded-md border bg-card p-4 pr-8 shadow-elevated",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-80",
              it.variant === "destructive" && "border-destructive/40 bg-destructive/5",
              it.variant === "success" && "border-emerald-500/40 bg-emerald-500/5"
            )}
          >
            <div>
              <ToastPrimitive.Title className="text-sm font-semibold">
                {it.title}
              </ToastPrimitive.Title>
              {it.description ? (
                <ToastPrimitive.Description className="mt-1 text-xs text-muted-foreground">
                  {it.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close className="absolute right-2 top-2 rounded-sm p-1 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col-reverse gap-2 outline-none sm:bottom-6 sm:right-6" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
