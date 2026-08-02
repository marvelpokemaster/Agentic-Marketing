import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { backendClient, BackendClientError } from "@/lib/backend";
import type { CampaignStatus } from "@/lib/types";

export async function GET(
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

    try {
      // Sync with backend state
      const backendState = await backendClient.getCampaign(campaignId);
      
      let shouldUpdate = false;
      let updateData: any = {};
      
      // Sync status
      if (backendState.status !== localCampaign.status) {
          updateData.status = backendState.status;
          shouldUpdate = true;
      }
      
      // Sync results & execution
      let results = { ...localCampaign.results } as any;
      if (backendState.leads && backendState.leads.length > 0) {
          results.leads = backendState.leads;
          shouldUpdate = true;
      }
      if (backendState.assets && backendState.assets.length > 0) {
          results.assets = backendState.assets;
          shouldUpdate = true;
      }
      if (backendState.research_report) {
          results.research_report = backendState.research_report;
          shouldUpdate = true;
      }
      if (backendState.results) {
          results = { ...results, ...backendState.results };
          shouldUpdate = true;
      }

      if (shouldUpdate || backendState.execution) {
          if (updateData.status) {
              await repo.updateCampaignStatus(campaignId, updateData.status);
          }
          await repo.updateCampaignResults(campaignId, results, (backendState.status as CampaignStatus) || localCampaign.status);
          
          // Re-fetch updated document from Firestore repo
          const updatedCampaign = await repo.getCampaign(user.id, campaignId);
          if (updatedCampaign) {
            // Attach live execution metadata if returned from backend
            if (backendState.execution) {
              (updatedCampaign as any).execution = backendState.execution;
            }
            return NextResponse.json({ campaign: updatedCampaign });
          }
      }
    } catch (backendError) {
      if (backendError instanceof BackendClientError && (backendError.status === 401 || backendError.code === "MISSING_CREDENTIALS")) {
        console.warn(`[AUTH PROPAGATION] Backend auth failed for campaign ${campaignId}: returning 401 to browser.`);
        return NextResponse.json(
          { error: "Authentication required.", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
      console.error("Error syncing with backend:", backendError);
    }

    return NextResponse.json({ campaign: localCampaign });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch campaign." },
      { status: 500 }
    );
  }
}
