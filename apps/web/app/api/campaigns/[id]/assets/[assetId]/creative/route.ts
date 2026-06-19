import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/db/repo";
import { generateCreative } from "@/lib/creative/generate";

export async function POST(
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
    const asset = campaign.assets.find((a) => a.id === params.assetId);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const prompt =
      typeof body.creative_prompt === "string" && body.creative_prompt
        ? body.creative_prompt
        : asset.creative_prompt;

    const creativeUrl = await generateCreative(prompt, asset.platform);
    const updated = await repo.updateAsset(params.id, params.assetId, {
      creative_prompt: prompt,
      creative_url: creativeUrl,
    });
    return NextResponse.json({ asset: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to regenerate creative." },
      { status: 500 },
    );
  }
}
