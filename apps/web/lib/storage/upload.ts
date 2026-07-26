import { getFirebaseAdminApp } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
}

/**
 * Upload a single asset and return a usable URL.
 * Uploads to Firebase Storage and returns the public URL.
 */
export async function uploadAsset(file: File, userId: string): Promise<string> {
  const app = getFirebaseAdminApp();
  const bucket = getStorage(app).bucket();
  const path = `${userId}/${uid()}-${safeName(file.name)}`;
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileRef = bucket.file(path);
  
  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type || "application/octet-stream",
    },
    public: true, // Make it publicly accessible
  });
  
  return fileRef.publicUrl();
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

