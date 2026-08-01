import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
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
    <div className="page">
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
    </div>
  );
}
