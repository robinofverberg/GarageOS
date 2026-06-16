import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required."
  );
}

const globalForSupabase = globalThis as typeof globalThis & {
  supabase?: SupabaseClient;
};

export const supabase: SupabaseClient =
  globalForSupabase.supabase ??
  createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}

/**
 * Generates a primary key for a new row. The schema uses plain TEXT ids that
 * were previously produced by Prisma's `cuid()` at the application layer, so
 * inserts via Supabase must supply their own id.
 */
export function newId(): string {
  return crypto.randomUUID();
}

/** Current timestamp as an ISO string for createdAt/updatedAt columns. */
export function now(): string {
  return new Date().toISOString();
}
