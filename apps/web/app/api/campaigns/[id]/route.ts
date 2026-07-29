import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getServerRepo } from "@/lib/db/repo";
import { backendClient } from "@/lib/backend";

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

    // Every workflow can have backend-owned research results. If a legacy
    // campaign has not been registered there yet, the request simply falls
    // back to its local record below.
    if (localCampaign.workflow) {
      try {
        // Sync with backend
        const backendState = await backendClient.getCampaign(campaignId);
        
        let shouldUpdate = false;
        let updateData: any = {};
        
        // Sync status
        if (backendState.status !== localCampaign.status) {
            updateData.status = backendState.status;
            shouldUpdate = true;
        }
        
        // Sync results
        let results = { ...localCampaign.results } as any;
        if (backendState.leads && backendState.leads.length > 0) {
            results.leads = backendState.leads;
            shouldUpdate = true;
        }
        
        if (backendState.research_report) {
            results.research_report = backendState.research_report;
            shouldUpdate = true;
        }
        if (localCampaign.workflow === "autopilot_campaign") {
          for (const key of ["assets", "journey", "decisions", "paid_campaign_plan", "research_summary", "leads"] as const) {
            const value = backendState[key];
            if (value !== undefined && value !== null) {
              (results as any)[key] = value;
              shouldUpdate = true;
            }
          }
        }
        
        if (shouldUpdate) {
            updateData.results = results;
            if (updateData.status) {
                await repo.updateCampaignStatus(campaignId, updateData.status);
            }
            if (updateData.results) {
                await repo.updateCampaignResults(campaignId, updateData.results, updateData.status || localCampaign.status);
            }
            
            // Re-fetch
            const updatedCampaign = await repo.getCampaign(user.id, campaignId);
            return NextResponse.json({ campaign: updatedCampaign });
        }
      } catch (backendError) {
          console.error("Error syncing with backend:", backendError);
      }
    }

    return NextResponse.json({ campaign: localCampaign });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch campaign." },
      { status: 500 }
    );
  }
}
