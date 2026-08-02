"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { FrostText } from "@/components/ui/FrostText";

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
        method: "POST",
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
    <div className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-6 py-20">
      {/* Aurora gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full opacity-30 blur-[100px]"
          style={{ background: "var(--gradient-glow)" }}
        />
      </div>

      {/* Glass card container */}
      <div className="relative rounded-2xl border border-border bg-glass-bg p-8 backdrop-blur-xl shadow-glass">
        {/* Gradient top accent bar */}
        <div
          className="absolute top-0 left-6 right-6 h-[2px] rounded-full"
          style={{ background: "var(--gradient-primary)" }}
        />

        <div className="pt-2">
          <span className="eyebrow">{mode === "signin" ? "Sign in" : "Create account"}</span>
          <div className="mt-4">
            <FrostText
              text={mode === "signin" ? "Welcome" : "Create your"}
              highlightText={mode === "signin" ? "back" : "account"}
              as="h1"
              className="text-3xl font-semibold"
            />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {mode === "signin"
              ? "Sign in to your workspace to manage products and campaigns."
              : "Set up a workspace to start running autonomous campaigns."}
          </p>
        </div>

        <hr className="rule my-7" />

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="label">Password</label>
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
            <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 p-3 text-xs font-medium text-danger backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <AnimatedButton
            type="submit"
            isLoading={loading}
            loadingText={mode === "signin" ? "Signing in..." : "Creating account..."}
            className="w-full py-3"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </AnimatedButton>
        </form>

        <hr className="rule my-7" />

        <button
          type="button"
          className="w-full text-center text-[13px] text-muted transition-colors hover:text-foreground"
          onClick={() => !loading && setMode(mode === "signin" ? "signup" : "signin")}
          disabled={loading}
        >
          {mode === "signin" ? (
            <>
              No account yet? <span className="font-medium gradient-text">Create one</span>
            </>
          ) : (
            <>
              Already have an account? <span className="font-medium gradient-text">Sign in</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
