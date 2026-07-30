import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { CampaignDashboard } from "@/components/CampaignDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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

export default async function CampaignPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  const repo = await getServerRepo();
  const campaign = await repo.getCampaign(user.id, params.id);
  if (!campaign) notFound();

  const metaConfigured = await isMetaConfiguredOnBackend();

  return (
    <div className="space-y-4">
      {campaign.workflow !== "lead_generation" && !metaConfigured && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400 flex items-start gap-3 shadow-md">
          <div className="mt-0.5 text-amber-400 shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-0.5">
            <span className="font-semibold block text-xs">Meta API integration is not configured on backend</span>
            <p className="text-muted/90 text-[11px] leading-normal">
              To publish posts directly to Facebook/Instagram, configure <code>META_ACCESS_TOKEN</code> on Railway. You can still generate and edit all assets here.
            </p>
          </div>
        </div>
      )}

      <ErrorBoundary>
        <CampaignDashboard campaign={campaign} metaConfigured={metaConfigured} />
      </ErrorBoundary>
    </div>
  );
}
