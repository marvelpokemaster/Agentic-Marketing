import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/db/repo";
import { generateCampaignContent } from "@/lib/ai/campaign";
import { generateCreative } from "@/lib/creative/generate";
import { ALL_PLATFORMS, type CampaignAsset, type Platform } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  const campaigns = await getRepo().listCampaigns(user.id);
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const productId = String(body.product_id ?? "");
    const platforms: Platform[] = Array.isArray(body.platforms)
      ? body.platforms.filter((p: Platform) => ALL_PLATFORMS.includes(p))
      : [];

    if (!productId) {
      return NextResponse.json({ error: "product_id is required." }, { status: 400 });
    }
    if (platforms.length === 0) {
      return NextResponse.json(
        { error: "Select at least one platform." },
        { status: 400 },
      );
    }

    const repo = getRepo();
    const product = await repo.getProduct(user.id, productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const { content, usedAi } = await generateCampaignContent(product, platforms);

    const assets: Omit<CampaignAsset, "id" | "campaign_id">[] = [];
    for (const platform of platforms) {
      const c = content[platform];
      let creativeUrl: string | null = null;
      try {
        creativeUrl = await generateCreative(c.creative_prompt, platform);
      } catch (err) {
        console.error("[campaign] creative failed:", err);
      }
      assets.push({
        platform,
        headline: c.headline,
        body: c.body,
        hashtags: c.hashtags,
        cta: c.cta,
        creative_prompt: c.creative_prompt,
        creative_url: creativeUrl,
        status: "draft",
        scheduled_time: null,
        external_id: null,
        error: null,
      });
    }

    const campaign = await repo.createCampaign(user.id, {
      product,
      platforms,
      assets,
    });

    return NextResponse.json({ campaign, usedAi });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate campaign." },
      { status: 500 },
    );
  }
}
