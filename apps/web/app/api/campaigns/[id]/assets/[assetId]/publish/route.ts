import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/db/repo";
import { publishAsset } from "@/lib/meta/publish";
import type { AssetStatus, CampaignStatus } from "@/lib/types";

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
    const result = await publishAsset(asset, scheduledTime);
    const status: AssetStatus = result.scheduled ? "scheduled" : "published";
    const updated = await repo.updateAsset(params.id, params.assetId, {
      status,
      external_id: result.externalId,
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

    return NextResponse.json({ asset: updated, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed.";
    const updated = await repo.updateAsset(params.id, params.assetId, {
      status: "failed",
      error: message,
    });
    return NextResponse.json({ asset: updated, error: message }, { status: 502 });
  }
}
