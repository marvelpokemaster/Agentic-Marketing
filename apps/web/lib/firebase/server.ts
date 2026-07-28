import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { clientConfig } from "./config";
import { authConfig } from "@/lib/auth";
import { initializeServerApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export async function getAuthenticatedApp() {
  const tokens = await getTokens(cookies(), authConfig);
  const authIdToken = tokens ? tokens.token : undefined;

  const app = initializeServerApp(
    clientConfig,
    authIdToken ? { authIdToken } : {}
  );
  
  return app;
}
