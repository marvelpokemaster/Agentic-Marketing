import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/db/repo";
import { CampaignDashboard } from "@/components/CampaignDashboard";

export const dynamic = "force-dynamic";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000";

async function isMetaConfiguredOnBackend(): Promise<boolean> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL.replace(/\/$/, "")}/publish/status`,
      { next: { revalidate: 60 } },
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
  const campaign = await getRepo().getCampaign(user.id, params.id);
  if (!campaign) notFound();

  const metaConfigured = await isMetaConfiguredOnBackend();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/campaigns" className="text-sm text-accent">
          ← Campaigns
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{campaign.product_name}</h1>
        <p className="text-muted">
          {campaign.workflow === "lead_generation"
            ? "Review discovered leads and outreach drafts."
            : "Review, edit, then publish or schedule each post."}
        </p>
      </div>

      {campaign.workflow !== "lead_generation" && !metaConfigured && (
        <div className="card border-accent/30 text-sm text-muted">
          Meta publishing is not configured on the backend. Add{" "}
          <code>META_ACCESS_TOKEN</code>, <code>META_PAGE_ID</code>, and{" "}
          <code>META_IG_USER_ID</code> to Railway to publish to Facebook and
          Instagram. You can still review and edit content now.
        </div>
      )}

      <CampaignDashboard campaign={campaign} metaConfigured={metaConfigured} />
    </div>
  );
}
