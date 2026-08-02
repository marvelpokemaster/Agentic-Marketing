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
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-20">
      <div>
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

      <hr className="rule my-8" />

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
          <div className="flex items-center gap-2 rounded-md border border-danger bg-panel p-3 text-xs font-medium text-danger">
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

      <hr className="rule my-8" />

      <button
        type="button"
        className="text-center text-[13px] text-muted transition-colors hover:text-foreground"
        onClick={() => !loading && setMode(mode === "signin" ? "signup" : "signin")}
        disabled={loading}
      >
        {mode === "signin" ? (
          <>
            No account yet? <span className="font-medium text-primary">Create one</span>
          </>
        ) : (
          <>
            Already have an account? <span className="font-medium text-primary">Sign in</span>
          </>
        )}
      </button>
    </div>
  );
}
