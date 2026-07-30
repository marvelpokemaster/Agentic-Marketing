"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { ShieldCheck, Mail, Lock, ArrowRight, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

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
    <div className="mx-auto max-w-md py-12 relative z-10">
      <Card className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-primary shadow-sm mb-2">
            <ShieldCheck className="h-5 w-5 animate-pulse" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-100">
            {mode === "signin" ? "Operator Authentication" : "Register Operator Profile"}
          </h1>
          <p className="font-sans text-xs text-muted/70 leading-relaxed">
            {mode === "signin" ? "Enter your workspace credentials to access AI Mission Control." : "Create an operator profile to orchestrate autonomous marketing campaigns."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Workspace Email</label>
            <div className="relative">
              <input
                type="email"
                placeholder="operator@company.com"
                className="input pl-10 font-mono text-xs"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <Mail className="h-4 w-4 text-muted/60 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="label">Access Key Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                className="input pl-10 font-mono text-xs"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
              <Lock className="h-4 w-4 text-muted/60 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <AnimatedButton
            type="submit"
            isLoading={loading}
            className="w-full py-3 font-bold"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            {mode === "signin" ? "Authenticate Operator" : "Register Operator Account"}
          </AnimatedButton>
        </form>

        <div className="pt-4 border-t border-border/40 text-center">
          <button
            type="button"
            className="font-mono text-xs font-semibold text-primary hover:underline transition"
            onClick={() => !loading && setMode(mode === "signin" ? "signup" : "signin")}
            disabled={loading}
          >
            {mode === "signin"
              ? "Need a workspace account? Register operator profile"
              : "Already registered? Authenticate existing operator"}
          </button>
        </div>
      </Card>
    </div>
  );
}
