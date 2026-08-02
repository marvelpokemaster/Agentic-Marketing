import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, Clock } from "lucide-react";
import { StageRail } from "@/components/ui/StageRail";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function CampaignDetailsLoading() {
  return (
    <div className="page max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1.5 font-mono text-xs text-muted opacity-50 cursor-not-allowed">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Campaigns</span>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <Clock className="h-4 w-4" />
          <Skeleton className="h-4 w-20" shimmer />
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-8 w-64 max-w-full" shimmer />
          <Skeleton className="h-4 w-32" shimmer />
        </div>
      </div>

      <div className="flex gap-8 border-b border-border">
        {["Overview", "Strategy", "Assets"].map((tab, i) => (
          <div
            key={i}
            className={`relative -mb-px pb-3 text-[13px] font-medium transition-colors ${
              i === 0 ? "text-foreground" : "text-muted"
            }`}
          >
            {tab}
            {i === 0 && (
              <span
                className="absolute bottom-0 left-0 h-[2px] w-full rounded-full"
                style={{ background: "var(--gradient-primary)" }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-glass-border bg-glass-bg p-8 shadow-glass backdrop-blur-md text-center space-y-6">
        <div className="space-y-1">
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Loading Campaign State
          </h3>
          <p className="text-xs text-muted">
            Connecting to agent execution engine...
          </p>
        </div>
        <StageRail currentStage="idle" isExecuting={false} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <GlassPanel className="p-6">
            <Skeleton className="h-6 w-32 mb-6" shimmer />
            <div className="space-y-8 pl-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="relative mt-1">
                    <Skeleton className="h-3 w-3 rounded-full" shimmer />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-40" shimmer />
                    <Skeleton className="h-4 w-full max-w-sm" shimmer />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
        <div className="space-y-6">
          <GlassPanel className="p-6">
            <Skeleton className="h-6 w-24 mb-6" shimmer />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" shimmer />
              <Skeleton className="h-10 w-full rounded-xl" shimmer />
              <Skeleton className="h-10 w-full rounded-xl" shimmer />
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
