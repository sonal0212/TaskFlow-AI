"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/**
 * Triggers Supabase hydration once on app mount. Renders nothing.
 * Mounted inside the (app) layout, so it only fires for authed routes.
 */
export function Hydrator() {
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return null;
}

/**
 * Visible banner that surfaces hydration progress / errors. Helpful when
 * the schema hasn't been installed yet.
 */
export function HydrationBanner() {
  const hydrating = useStore((s) => s.hydrating);
  const hydrated = useStore((s) => s.hydrated);
  const error = useStore((s) => s.hydrationError);

  if (!error || !hydrated) return null;

  return (
    <div className="border-b border-destructive/40 bg-destructive/10 px-6 py-2 text-xs text-destructive">
      <strong>Supabase not reachable —</strong> {error}.{" "}
      Make sure you've run <code className="rounded bg-card px-1">supabase/schema.sql</code> in your Supabase SQL editor and that the project ID + anon key in <code className="rounded bg-card px-1">.env.local</code> are correct.
    </div>
  );
}
