"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface HeaderAuthProps {
  initialEmail: string | null;
}

export default function HeaderAuth({ initialEmail }: HeaderAuthProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  if (!initialEmail || !supabase) return null;

  async function handleLogout() {
    await supabase!.auth.signOut();
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
