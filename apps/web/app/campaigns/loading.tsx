import { Skeleton } from "@/components/ui/Skeleton";
import { Package, Megaphone, ArrowRight } from "lucide-react";

export default function CampaignsLoading() {
  return (
    <div className="page space-y-10">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div>
          <span className="eyebrow">Runs</span>
          <div className="mt-3">
            <h1 className="text-3xl font-semibold sm:text-4xl font-heading text-foreground">
              Campaign <span className="gradient-text">Missions</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted max-w-lg">
              Execution state, generated assets, and publishing status for every campaign.
            </p>
          </div>
        </div>

        <div className="btn-ghost text-[13px] shrink-0 opacity-50 cursor-not-allowed">
          <Package className="h-4 w-4" />
          <span>Choose a product</span>
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-glass-bg p-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-6 accent-bar-left"
          >
            <div className="flex min-w-0 items-center gap-4">
              <Skeleton className="h-6 w-20 rounded-full" shimmer />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-32" shimmer />
                <Skeleton className="h-3 w-24" shimmer />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-6 w-24 rounded-full" shimmer />
                <Skeleton className="h-6 w-16 rounded-full" shimmer />
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
