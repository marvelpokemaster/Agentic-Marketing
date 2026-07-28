import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { serverConfig, clientConfig } from "./config";
import { initializeServerApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export async function getAuthenticatedApp() {
  const tokens = await getTokens(cookies(), serverConfig);
  const authIdToken = tokens ? tokens.token : undefined;

  const app = initializeServerApp(
    clientConfig,
    authIdToken ? { authIdToken } : {}
  );
  
  return app;
}
