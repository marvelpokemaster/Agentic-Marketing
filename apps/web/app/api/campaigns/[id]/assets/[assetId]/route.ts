import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/db/repo";
import type { CampaignAsset } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; assetId: string } },
) {
  try {
    const user = await getCurrentUser();
    const repo = getRepo();

    const campaign = await repo.getCampaign(user.id, params.id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    const body = await request.json();
    const patch: Partial<CampaignAsset> = {};
    if (typeof body.headline === "string") patch.headline = body.headline;
    if (typeof body.body === "string") patch.body = body.body;
    if (typeof body.cta === "string") patch.cta = body.cta;
    if (typeof body.creative_prompt === "string")
      patch.creative_prompt = body.creative_prompt;
    if (Array.isArray(body.hashtags)) {
      patch.hashtags = body.hashtags
        .map((h: unknown) => String(h).replace(/^#/, "").trim())
        .filter(Boolean);
    } else if (typeof body.hashtags === "string") {
      patch.hashtags = body.hashtags
        .split(/[\s,]+/)
        .map((h: string) => h.replace(/^#/, "").trim())
        .filter(Boolean);
    }

    const updated = await repo.updateAsset(params.id, params.assetId, patch);
    if (!updated) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }
    return NextResponse.json({ asset: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update asset." },
      { status: 500 },
    );
  }
}
