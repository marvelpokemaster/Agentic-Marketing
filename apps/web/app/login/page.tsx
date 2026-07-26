"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userCredential = mode === "signin"
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);
      
      const idToken = await userCredential.user.getIdToken();

      // Hit the middleware to set the cookie
      await fetch("/api/login", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      router.push("/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        {/* Header logo / title */}
        <div className="space-y-1.5 text-center">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shadow-sm mb-2">
            <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {mode === "signin" ? "Sign in to Studio" : "Create account"}
          </h1>
          <p className="text-xs text-muted">
            {mode === "signin" ? "Enter your credentials to access your campaign dashboard" : "Sign up to start generating AI campaigns"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="label">Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Password</label>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400">
              {error}
            </div>
          )}

          <button type="submit" className={`btn w-full flex items-center justify-center gap-2 ${loading ? "pulse-glow" : ""}`} disabled={loading}>
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-[#04130d]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Authenticating...</span>
              </>
            ) : mode === "signin" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-border/40 text-center">
          <button
            type="button"
            className="text-xs font-semibold text-primary/95 hover:text-primary transition"
            onClick={() => !loading && setMode(mode === "signin" ? "signup" : "signin")}
            disabled={loading}
          >
            {mode === "signin"
              ? "Need a workspace account? Sign up free"
              : "Already have a workspace account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
