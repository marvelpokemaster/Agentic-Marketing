import { getTokens } from "next-firebase-auth-edge";
import { serverConfig } from "@/lib/firebase/config";
import { cookies } from "next/headers";
import type { CurrentUser } from "@/lib/types";

export const authConfig = {
  apiKey: serverConfig.firebaseApiKey || "",
  cookieName: "AuthToken",
  cookieSignatureKeys: ["secret1", "secret2"],
  serviceAccount: serverConfig.serviceAccount
};

/**
 * Resolve the current authenticated user.
 * Throws an error if the user is not authenticated.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  // Demo mode fallback
  if (!serverConfig.serviceAccount.privateKey) {
    return {
      id: "demo-user-123",
      email: "demo@agentic-marketing.local",
      user_metadata: {},
    };
  }

  const tokens = await getTokens(cookies(), authConfig);

  if (!tokens) {
    throw new Error("Authentication required.");
  }

  return {
    id: tokens.decodedToken.uid,
    email: tokens.decodedToken.email ?? null,
    user_metadata: {},
  };
}
