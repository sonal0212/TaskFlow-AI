import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client.
 *
 * Uses the anon (publishable) key; row-level security in Supabase enforces
 * who can read/write what. The Spring Boot backend talks to Postgres directly
 * with the service role for trusted server-side operations.
 *
 * The current frontend ships with a local zustand store + mock data so the
 * app can be demoed without a live backend. To migrate any component to live
 * data, swap the relevant store call for a Supabase query (see example below).
 *
 * Example:
 *   const { data, error } = await supabase
 *     .from("tasks")
 *     .select("*")
 *     .eq("project_id", projectId);
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local"
    );
  }
  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

/** Convenience export for consumers that don't need lazy init. */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const SUPABASE_CONFIGURED = Boolean(url && anonKey);
