import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { PLATFORM_LABELS } from "@/lib/types";
import { Megaphone, ArrowRight, Calendar, Package } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  const repo = await getServerRepo();
  const campaigns = await repo.listCampaigns(user.id);

  return (
    <div className="space-y-8 relative z-10">
      <SectionHeader
        badge="Active Stream Telemetry"
        title="Campaign Streams"
        subtitle="Review active agent execution state, published social assets, and live broadcast channels."
        action={
          <Link href="/products" className="btn btn-ghost text-xs py-2 flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            <span>Select Product Profile</span>
          </Link>
        }
      />

      {campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6 text-primary" />}
          title="No Campaigns Executed Yet"
          description="Select an onboarded product profile to orchestrate your first autonomous AI campaign."
          action={
            <Link href="/products" className="btn text-xs py-2">
              Select Product
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/campaigns/${c.id}`} className="block group">
              <Card interactive className="flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 truncate">
                    <h4 className="font-heading font-bold text-base text-foreground group-hover:text-primary transition duration-200 truncate">
                      {c.product_name}
                    </h4>
                    <span className="font-mono text-[10px] text-muted flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(c.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {c.workflow === "lead_generation" ? (
                      <span className="font-mono text-[10px] bg-primary/10 text-primary border border-primary/20 py-0.5 px-2.5 rounded font-semibold">
                        B2B Lead Discovery
                      </span>
                    ) : c.platforms && c.platforms.length > 0 ? (
                      c.platforms.map((p) => (
                        <span key={p} className="font-mono text-[10px] bg-primary/10 text-primary border border-primary/20 py-0.5 px-2.5 rounded font-semibold">
                          {PLATFORM_LABELS[p]}
                        </span>
                      ))
                    ) : (
                      <span className="font-mono text-[10px] bg-surface text-muted border border-border/40 py-0.5 px-2.5 rounded font-semibold">
                        Social Post
                      </span>
                    )}
                  </div>

                  <span className="font-sans text-xs font-semibold text-primary group-hover:text-primary flex items-center gap-1 transition duration-200">
                    <span>Open Stream</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
