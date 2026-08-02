import { NextRequest, NextResponse } from "next/server";
import { authMiddleware, redirectToHome, redirectToLogin } from "next-firebase-auth-edge";
import { clientConfig, serverConfig } from "@/lib/firebase/config";

const PUBLIC_PATHS = ["/login"];

export async function middleware(request: NextRequest) {
  // Demo mode fallback: if Firebase is not fully configured, bypass auth
  if (!serverConfig.serviceAccount.privateKey) {
    return NextResponse.next();
  }

  return authMiddleware(request, {
    loginPath: "/api/login",
    logoutPath: "/api/logout",
    apiKey: clientConfig.apiKey,
    cookieName: "AuthToken",
    cookieSignatureKeys: ["secret1", "secret2"],
    cookieSerializeOptions: {
      path: "/",
      httpOnly: true,
      secure: serverConfig.useSecureCookies,
      sameSite: "lax" as const,
      maxAge: 12 * 60 * 60 * 24,
    },
    serviceAccount: serverConfig.serviceAccount,
    handleValidToken: async ({ token, decodedToken }, headers) => {
      if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
        return redirectToHome(request);
      }
      return NextResponse.next({
        request: { headers },
      });
    },
    handleInvalidToken: async (reason) => {
      console.info("Missing or malformed credentials", { reason });
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Unauthorized", reason },
          { status: 401 }
        );
      }
      return redirectToLogin(request, {
        path: "/login",
        publicPaths: PUBLIC_PATHS,
      });
    },
    handleError: async (error) => {
      console.error("Unhandled authentication error", { error });
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Internal authentication error" },
          { status: 500 }
        );
      }
      return redirectToLogin(request, {
        path: "/login",
        publicPaths: PUBLIC_PATHS,
      });
    },
  });
}

export const config = {
  matcher: [
    "/",
    "/((?!_next|favicon.ico|.*\\.).*)",
  ],
};
