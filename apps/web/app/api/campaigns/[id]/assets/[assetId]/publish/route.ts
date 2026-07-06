import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/db/repo";
import type { AssetStatus, CampaignStatus } from "@/lib/types";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000";

export async function POST(
  request: Request,
  { params }: { params: { id: string; assetId: string } },
) {
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
  const scheduledTime: string | null =
    typeof body.scheduled_time === "string" && body.scheduled_time
      ? body.scheduled_time
      : null;

  await repo.updateAsset(params.id, params.assetId, {
    status: "publishing",
    error: null,
  });

  try {
    // Proxy publish request to FastAPI backend
    const res = await fetch(
      `${BACKEND_API_URL.replace(/\/$/, "")}/publish/${asset.platform}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: asset.platform,
          headline: asset.headline,
          body: asset.body,
          hashtags: asset.hashtags,
          cta: asset.cta,
          creative_prompt: asset.creative_prompt,
          creative_url: asset.creative_url,
          campaign_id: params.id,
          scheduled_time: scheduledTime,
        }),
      },
    );
    
    let data: any = null;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json().catch(() => ({}));
    } else {
      const text = await res.text().catch(() => "");
      data = { detail: text || `API request failed with status ${res.status}` };
    }

    if (!res.ok) {
      throw new Error(data.detail || data.error || `Publish failed with status ${res.status}`);
    }

    const status: AssetStatus = data.scheduled ? "scheduled" : "published";
    const updated = await repo.updateAsset(params.id, params.assetId, {
      status,
      external_id: data.external_id,
      scheduled_time: scheduledTime,
      error: null,
    });

    // Roll up campaign status.
    const fresh = await repo.getCampaign(user.id, params.id);
    if (fresh) {
      const published = fresh.assets.filter(
        (a) => a.status === "published" || a.status === "scheduled",
      ).length;
      const campaignStatus: CampaignStatus =
        published === 0
          ? "ready"
          : published === fresh.assets.length
            ? "published"
            : "partially_published";
      await repo.updateCampaignStatus(params.id, campaignStatus);
    }

    return NextResponse.json({ asset: updated, result: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed.";
    const updated = await repo.updateAsset(params.id, params.assetId, {
      status: "failed",
      error: message,
    });
    return NextResponse.json({ asset: updated, error: message }, { status: 502 });
  }
}
