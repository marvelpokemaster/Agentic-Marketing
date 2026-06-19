import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isSupabaseServiceConfigured,
  supabaseServiceRoleKey,
  supabaseUrl,
} from "./config";

let cached: SupabaseClient | null = null;

/**
 * Service-role Supabase client for privileged server operations
 * (storage uploads, inserts that bypass RLS during demo). Never expose to client.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseServiceConfigured()) return null;
  if (cached) return cached;
  cached = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
