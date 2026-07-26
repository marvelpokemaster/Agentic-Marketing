"use client";

import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";

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
    <div className="flex items-center gap-4">
      <span className="text-xs text-muted">
        Logged in as <strong className="text-foreground">{initialEmail}</strong>
      </span>
      <button onClick={handleLogout} className="chip hover:chip-on text-danger">
        Logout
      </button>
    </div>
  );
}
