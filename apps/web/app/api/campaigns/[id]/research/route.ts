import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { backendClient, BackendClientError } from "@/lib/backend";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const repo = await getServerRepo();
    const campaignId = params.id;
    const force = new URL(request.url).searchParams.get("force") === "true";
    
    // Check if campaign exists
    const localCampaign = await repo.getCampaign(user.id, campaignId);
    if (!localCampaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    let backendCampaign;
    try {
      backendCampaign = await backendClient.runCampaignResearch(campaignId, force);
    } catch (err) {
      // Legacy organic campaigns are created locally first. Register the same
      // record with the backend on first research request, then retry once.
      if (!(err instanceof BackendClientError) || err.status !== 404) throw err;
      const product = await repo.getProduct(user.id, localCampaign.product_id);
      if (!product) throw new Error("Campaign product not found.");
      await backendClient.createCampaign(campaignId, localCampaign.product_name, localCampaign.workflow, {
        product_name: product.name,
        product_description: product.description,
        target_audience: product.target_audience,
        industry: product.industry,
        platforms: localCampaign.platforms,
      });
      backendCampaign = await backendClient.runCampaignResearch(campaignId, force);
    }

    const nextStatus = backendCampaign.status as any;
    const results = { ...(localCampaign.results as any) };
    if (backendCampaign.research_report) results.research_report = backendCampaign.research_report;
    await repo.updateCampaignResults(campaignId, results, nextStatus);
    
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
