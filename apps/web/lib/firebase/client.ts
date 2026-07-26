import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Lazy-initialize storage to avoid "Service storage is not available" during SSG
let _storage: FirebaseStorage | null = null;
export function getClientStorage(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(app);
  }
  return _storage;
}
