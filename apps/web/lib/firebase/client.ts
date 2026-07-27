import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Lazy-initialize storage to avoid "Service storage is not available" during SSG
let _storage: FirebaseStorage | null = null;
export function getClientStorage(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(app);
  }
  return _storage;
}
