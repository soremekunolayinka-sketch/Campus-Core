import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Supabase client for use in Client Components.
 * RLS policies (supabase/migrations/0002_rls_policies.sql) are the actual
 * enforcement layer — this client just carries the user's session so those
 * policies can evaluate `auth.uid()` correctly. Never bypass RLS from here.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
