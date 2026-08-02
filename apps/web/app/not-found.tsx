import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center px-6 py-24">
      {/* Aurora gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full opacity-25 blur-[80px]"
          style={{ background: "var(--gradient-glow)" }}
        />
      </div>

      <span className="font-heading text-7xl font-extrabold gradient-text">404</span>
      <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground">
        Page not found
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        That route or campaign doesn&apos;t exist, or it has moved.
      </p>

      <hr className="rule my-8" />

      <div>
        <Link href="/campaigns" className="btn-ghost text-[13px]">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to campaigns</span>
        </Link>
      </div>
    </div>
  );
}
