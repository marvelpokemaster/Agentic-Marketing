import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 relative z-10 text-center">
      <Card className="space-y-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs font-bold text-rose-500 uppercase tracking-widest block">
            404 — TELEMETRY_NOT_FOUND
          </span>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Node or Resource Missing
          </h1>
          <p className="font-sans text-xs text-muted leading-relaxed max-w-xs mx-auto">
            The requested mission route or campaign asset does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-4 border-t border-border/40">
          <Link
            href="/campaigns"
            className="btn btn-ghost text-xs py-2.5 px-6 inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Mission Control</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
