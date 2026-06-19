import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CurrentUser } from "@/lib/types";

export const DEMO_USER: CurrentUser = {
  id: "demo-user",
  email: "demo@local",
  isDemo: true,
};

/**
 * Resolve the current user. In demo mode (no Supabase) returns a fixed demo user
 * so the full flow is usable without auth setup.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  if (!isSupabaseConfigured()) return DEMO_USER;

  const supabase = createSupabaseServerClient();
  if (!supabase) return DEMO_USER;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return DEMO_USER;
  return { id: user.id, email: user.email ?? null, isDemo: false };
}
