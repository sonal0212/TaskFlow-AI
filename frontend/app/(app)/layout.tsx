"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/app/sidebar";
import { Hydrator, HydrationBanner } from "@/components/app/hydrator";
import { useStore } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authed = useStore((s) => s.authedUserId);
  const hydrated = useStore((s) => s.hydrated);
  const hydrating = useStore((s) => s.hydrating);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !authed) router.replace("/login");
  }, [mounted, authed, router]);

  if (!mounted) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading workspace…
      </div>
    );
  }

  if (!authed) return null;

  return (
    <>
      <Hydrator />
      {!hydrated || hydrating ? (
        <div className="grid min-h-screen place-items-center">
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Syncing workspace from Supabase…</span>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <HydrationBanner />
            {children}
          </div>
        </div>
      )}
    </>
  );
}
