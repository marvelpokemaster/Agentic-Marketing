import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { CampaignDashboard } from "@/components/CampaignDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { StageRail } from "@/components/ui/StageRail";
import { GlassPanel } from "@/components/ui/GlassPanel";

export const dynamic = "force-dynamic";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000";

async function isMetaConfiguredOnBackend(): Promise<boolean> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL.replace(/\/$/, "")}/publish/status`,
      { cache: "no-store" },
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data.configured === true;
  } catch {
    return false;
  }
}

function CampaignDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1.5 font-mono text-xs text-muted opacity-50">
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

      <div className="glass-panel flex flex-col items-center justify-center p-8 text-center space-y-6">
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
          <GlassPanel level={2} className="p-6">
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
          <GlassPanel level={2} className="p-6">
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

async function CampaignDetailsContent({ campaignId }: { campaignId: string }) {
  const user = await getCurrentUser();
  const repo = await getServerRepo();
  const campaign = await repo.getCampaign(user.id, campaignId);
  if (!campaign) notFound();

  const metaConfigured = await isMetaConfiguredOnBackend();

  return (
    <>
      {campaign.workflow !== "lead_generation" && !metaConfigured && (
        <div className="mb-8 flex items-start gap-3 rounded-md border border-warning bg-panel p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <span className="block text-xs font-semibold text-foreground">
              Meta publishing is not configured
            </span>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Set <code className="code-token">META_ACCESS_TOKEN</code> on the backend to
              publish to Facebook and Instagram. You can still generate and edit every
              asset here.
            </p>
          </div>
        </div>
      )}

      <ErrorBoundary>
        <CampaignDashboard campaign={campaign} metaConfigured={metaConfigured} />
      </ErrorBoundary>
    </>
  );
}

export default function CampaignPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="page">
      <Suspense fallback={<CampaignDetailsSkeleton />}>
        <CampaignDetailsContent campaignId={params.id} />
      </Suspense>
    </div>
  );
}
