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
      const pathname = request.nextUrl.pathname;
      const isPublicPath = PUBLIC_PATHS.includes(pathname);

      // Expected anonymous access to a public route (e.g. /login or /login?redirect=...)
      // Do not log warning/error for expected anonymous access to public routes
      if (isPublicPath) {
        return redirectToLogin(request, {
          path: "/login",
          publicPaths: PUBLIC_PATHS,
        });
      }

      if (pathname.startsWith("/api/")) {
        console.warn(`[AUTH] Missing credentials on protected API route: ${pathname}`, { reason });
        return NextResponse.json(
          { error: "Unauthorized", reason },
          { status: 401 }
        );
      }

      console.warn(`[AUTH] Missing credentials on protected page: ${pathname}`, { reason });
      return redirectToLogin(request, {
        path: "/login",
        publicPaths: PUBLIC_PATHS,
      });
    },
    handleError: async (error) => {
      const pathname = request.nextUrl.pathname;
      console.error(`[AUTH] Unhandled authentication error on ${pathname}:`, { error });
      if (pathname.startsWith("/api/")) {
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
