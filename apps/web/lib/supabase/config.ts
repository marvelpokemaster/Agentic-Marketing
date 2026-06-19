export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const supabaseStorageBucket =
  process.env.SUPABASE_STORAGE_BUCKET ?? "product-assets";

/** True when the public Supabase client can be created. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/** True when privileged server-side operations are possible. */
export function isSupabaseServiceConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}
