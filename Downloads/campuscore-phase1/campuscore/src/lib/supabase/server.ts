import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads/writes the session cookie so the user's identity — and therefore
 * their RLS-scoped access — carries through server-side rendering.
 *
 * Deliberately NOT using the service role key here. Regular server-side
 * requests should run as the requesting user, same as the browser client,
 * so RLS applies identically everywhere. The service role key is reserved
 * for isolated, explicit admin/background jobs (see supabaseAdmin below).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component that can't set cookies —
            // safe to ignore when middleware.ts is refreshing the session.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // See note above.
          }
        }
      }
    }
  );
}

/**
 * Admin client using the service role key — bypasses RLS entirely.
 * Restricted to explicit, audited, server-only operations: bulk import
 * jobs (Phase 3), scheduled notification triggers, and similar system
 * tasks. Never import this into anything that handles a normal user
 * request — that must go through createClient() above so RLS applies.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {}
      }
    }
  );
}
