import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { backendClient } from "@/lib/backend";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const repo = await getServerRepo();
    const campaignId = params.id;
    
    // Check if campaign exists
    const localCampaign = await repo.getCampaign(user.id, campaignId);
    if (!localCampaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    // Parse optional force_refresh parameter
    const body = await request.json().catch(() => ({}));
    const forceRefresh = !!body.force_refresh;

    // Trigger research on backend (backend handles setting status to researching or draft)
    await backendClient.runCampaignResearch(campaignId, forceRefresh);
    
    // Return updated campaign
    const updatedCampaign = await repo.getCampaign(user.id, campaignId);

    return NextResponse.json({ campaign: updatedCampaign });
  } catch (err) {
    console.error("Error triggering research:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to trigger research." },
      { status: 500 }
    );
  }
}
