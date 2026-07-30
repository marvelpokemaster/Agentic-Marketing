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
    
    // Check if campaign exists and user owns it
    const localCampaign = await repo.getCampaign(user.id, campaignId);
    if (!localCampaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    // Parse payload options
    const body = await request.json().catch(() => ({}));
    const refreshType = body.refresh_type || "none";
    const resume = !!body.resume;

    // Delegate execution trigger to FastAPI backend
    await backendClient.runCampaign(campaignId, {
      refresh_type: refreshType,
      resume,
    });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error triggering campaign execution:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to trigger campaign execution." },
      { status: err?.status || 500 }
    );
  }
}
