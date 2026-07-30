"use client";

import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { LogOut } from "lucide-react";

interface HeaderAuthProps {
  initialEmail: string | null;
}

export default function HeaderAuth({ initialEmail }: HeaderAuthProps) {
  const router = useRouter();

  if (!initialEmail) return null;

  async function handleLogout() {
    await auth.signOut();
    await fetch("/api/logout", { method: "GET" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="p-2 rounded-lg bg-surface/50 border border-border/40 text-muted/80 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition duration-200"
      title="Sign Out Operator"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
