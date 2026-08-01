import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center px-6 py-24">
      <span className="eyebrow">404</span>
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
