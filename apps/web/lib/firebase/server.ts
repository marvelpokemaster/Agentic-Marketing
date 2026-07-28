import { initializeServerApp } from "firebase/app";
import { getDataConnect, type DataConnect } from "firebase/data-connect";
import { getAuth } from "firebase/auth";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { firebaseConfig } from "./config";
import { authConfig } from "@/lib/auth";
import { connectorConfig } from "@/lib/dataconnect";
import { serverConfig } from "@/lib/firebase/config";

/**
 * Creates a request-scoped, authenticated DataConnect instance for use in
 * Next.js Server Components and API Route Handlers.
 *
 * Uses `initializeServerApp` to create an isolated FirebaseApp bound to the
 * current user's ID token (extracted from next-firebase-auth-edge cookies).
 * The resulting DataConnect instance carries the user's authentication context,
 * allowing `@auth(level: USER)` queries to succeed during SSR.
 *
 * Returns `null` if no valid authentication tokens are found in cookies.
 */
export async function getAuthenticatedDataConnect(): Promise<DataConnect | null> {
  // Demo mode fallback
  if (!serverConfig.serviceAccount.privateKey) {
    return null;
  }

  const tokens = await getTokens(cookies(), authConfig);

  if (!tokens) {
    return null;
  }

  const idToken = tokens.token;

  // Create a request-scoped FirebaseServerApp with the user's ID token.
  // Each call produces an isolated instance — no global state leakage.
  const serverApp = initializeServerApp(firebaseConfig, {
    authIdToken: idToken,
  });

  // Wait for the auth state to be ready with the provided token.
  // This ensures DataConnect picks up the authenticated user.
  const serverAuth = getAuth(serverApp);
  await serverAuth.authStateReady();

  // Return a DataConnect instance bound to the authenticated server app.
  return getDataConnect(serverApp, connectorConfig);
}
