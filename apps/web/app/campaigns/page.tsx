import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { PLATFORM_LABELS } from "@/lib/types";
import { Megaphone, ArrowRight, Package } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FrostText } from "@/components/ui/FrostText";
import { Skeleton } from "@/components/ui/Skeleton";

export const dynamic = "force-dynamic";

function CampaignsListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="group relative flex flex-col gap-4 rounded-2xl border border-border glass-panel p-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-6 accent-bar-left"
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
  );
}

async function CampaignsList() {
  const start = Date.now();
  console.log(`[CAMPAIGNS DEBUG] CampaignsList fetch started at ${start}`);
  const user = await getCurrentUser();
  const repo = await getServerRepo();
  const campaigns = await repo.listCampaigns(user.id);
  console.log(`[CAMPAIGNS DEBUG] CampaignsList fetch completed in ${Date.now() - start}ms`);

  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon={<Megaphone className="h-7 w-7" />}
        title="No campaigns yet"
        description="Pick a product and choose a campaign type to start your first autonomous run."
        action={
          <Link href="/products" className="btn text-[13px]">
            Choose a product
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      {campaigns.map((c) => (
        <Link
          key={c.id}
          href={`/campaigns/${c.id}`}
          className="group relative flex flex-col gap-4 rounded-2xl border border-border glass-panel p-5 backdrop-blur-md transition-all duration-200 hover:border-border-hover hover:bg-glass-2-bg-hover hover:shadow-glow sm:flex-row sm:items-center sm:justify-between sm:gap-6 accent-bar-left"
        >
          <div className="flex min-w-0 items-center gap-4">
            <StatusBadge status={c.status} size="sm" />
            <div className="min-w-0">
              <h3 className="truncate font-heading text-[15px] font-semibold text-foreground">
                {c.product_name}
              </h3>
              <span className="mt-0.5 block font-mono text-[11px] text-muted">
                {new Date(c.created_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="flex flex-wrap gap-1.5">
              {c.workflow === "lead_generation" ? (
                <span className="chip">Lead generation</span>
              ) : c.platforms && c.platforms.length > 0 ? (
                c.platforms.map((p) => (
                  <span key={p} className="chip">
                    {PLATFORM_LABELS[p]}
                  </span>
                ))
              ) : (
                <span className="chip">Social post</span>
              )}
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-primary" />
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <div className="page space-y-10">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div>
          <span className="eyebrow">Runs</span>
          <div className="mt-3">
            <FrostText
              text="Campaign"
              highlightText="Missions"
              as="h1"
              className="text-3xl font-semibold sm:text-4xl"
              subtitle="Execution state, generated assets, and publishing status for every campaign."
            />
          </div>
        </div>

        <Link href="/products" className="btn-ghost text-[13px] shrink-0">
          <Package className="h-4 w-4" />
          <span>Choose a product</span>
        </Link>
      </div>

      <Suspense fallback={<CampaignsListSkeleton />}>
        <CampaignsList />
      </Suspense>
    </div>
  );
}
