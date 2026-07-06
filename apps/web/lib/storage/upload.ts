import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseStorageBucket, isSupabaseConfigured } from "@/lib/supabase/config";

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
}

/**
 * Upload a single asset and return a usable URL.
 * Uploads to Supabase Storage and returns the public URL.
 */
export async function uploadAsset(file: File, userId: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured for storage uploads.");
  }

  const supabase = getSupabaseAdmin() ?? createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Failed to initialize Supabase client for storage uploads.");
  }

  const path = `${userId}/${uid()}-${safeName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(supabaseStorageBucket)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from(supabaseStorageBucket)
    .getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAssets(
  files: File[],
  userId: string,
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    if (file && file.size > 0) {
      urls.push(await uploadAsset(file, userId));
    }
  }
  return urls;
}

