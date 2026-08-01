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
      className="flex shrink-0 items-center justify-center rounded-md border border-border bg-panel p-1.5 text-muted transition-colors hover:border-danger hover:text-danger"
      title="Sign out"
    >
      <LogOut className="h-4 w-4 shrink-0" />
    </button>
  );
}
