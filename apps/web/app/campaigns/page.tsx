import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { PLATFORM_LABELS } from "@/lib/types";
import { Megaphone, ArrowRight, Package } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  const repo = await getServerRepo();
  const campaigns = await repo.listCampaigns(user.id);

  return (
    <div className="page">
      <SectionHeader
        badge="Runs"
        title="Campaigns"
        subtitle="Execution state, generated assets, and publishing status for every campaign."
        action={
          <Link href="/products" className="btn-ghost text-[13px]">
            <Package className="h-4 w-4" />
            <span>Choose a product</span>
          </Link>
        }
      />

      {campaigns.length === 0 ? (
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
      ) : (
        <div className="border-t border-border">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="group flex flex-col gap-4 border-b border-border py-5 transition-colors hover:bg-panel sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-4"
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

                <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
