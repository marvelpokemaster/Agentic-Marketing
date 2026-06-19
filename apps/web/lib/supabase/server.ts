import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl, isSupabaseConfigured } from "./config";

/**
 * Cookie-aware Supabase client for Server Components and Route Handlers.
 * Returns null when Supabase is not configured (demo mode).
 */
export function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component — safe to ignore; middleware refreshes.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Ignore in read-only contexts.
        }
      },
    },
  });
}
