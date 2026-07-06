import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/lib/types";

/**
 * Resolve the current authenticated user.
 * Throws an error if the user is not authenticated.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Authentication required.");
  }

  return {
    id: user.id,
    email: user.email ?? null,
    user_metadata: user.user_metadata ?? {},
  };
}

