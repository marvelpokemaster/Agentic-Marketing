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
      className="p-2 rounded-lg bg-surface border border-border/40 text-muted hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 transition duration-200 flex items-center justify-center shrink-0 overflow-hidden"
      title="Sign Out Operator"
    >
      <LogOut className="h-[18px] w-[18px] shrink-0" />
    </button>
  );
}
