import type { CampaignAsset } from "@/lib/types";
import {
  isMetaConfigured,
  metaAccessToken,
  metaGraphUrl,
  metaIgUserId,
  metaPageId,
} from "./config";

export interface PublishResult {
  externalId: string;
  scheduled: boolean;
}

export function captionFor(asset: CampaignAsset): string {
  const tags = asset.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
  return [asset.body, asset.cta, tags].filter(Boolean).join("\n\n");
}

async function graphPost(
  path: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({ ...params, access_token: metaAccessToken });
  const res = await fetch(metaGraphUrl(path), { method: "POST", body });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = data?.error as { message?: string } | undefined;
    throw new Error(err?.message || `Meta Graph HTTP ${res.status}`);
  }
  return data;
}

/** Facebook Page photo post, with optional native scheduling. */
async function publishFacebook(
  asset: CampaignAsset,
  scheduledTime: string | null,
): Promise<PublishResult> {
  if (!metaPageId) throw new Error("META_PAGE_ID not configured.");
  if (!asset.creative_url) throw new Error("No creative image to publish.");

  const params: Record<string, string> = {
    url: asset.creative_url,
    caption: captionFor(asset),
  };

  let scheduled = false;
  if (scheduledTime) {
    const ts = Math.floor(new Date(scheduledTime).getTime() / 1000);
    params.published = "false";
    params.scheduled_publish_time = String(ts);
    scheduled = true;
  }

  const data = await graphPost(`${metaPageId}/photos`, params);
  const id = (data.post_id || data.id) as string;
  return { externalId: id, scheduled };
}

/** Instagram Business publish: create container then publish. */
async function publishInstagram(asset: CampaignAsset): Promise<PublishResult> {
  if (!metaIgUserId) throw new Error("META_IG_USER_ID not configured.");
  if (!asset.creative_url) throw new Error("No creative image to publish.");

  const container = await graphPost(`${metaIgUserId}/media`, {
    image_url: asset.creative_url,
    caption: captionFor(asset),
  });
  const creationId = container.id as string;
  if (!creationId) throw new Error("Instagram: no media container id returned.");

  const published = await graphPost(`${metaIgUserId}/media_publish`, {
    creation_id: creationId,
  });
  return { externalId: published.id as string, scheduled: false };
}

/**
 * Publish (or schedule) a single asset to its platform via the Meta Graph API.
 * Instagram has no native scheduling endpoint, so scheduled IG posts are left
 * for a scheduler/worker and reported back to the caller.
 */
export async function publishAsset(
  asset: CampaignAsset,
  scheduledTime: string | null = null,
): Promise<PublishResult> {
  if (!isMetaConfigured()) {
    throw new Error(
      "Meta publishing is not configured. Set META_ACCESS_TOKEN and page/IG IDs.",
    );
  }

  if (asset.platform === "facebook") {
    return publishFacebook(asset, scheduledTime);
  }
  if (asset.platform === "instagram") {
    if (scheduledTime) {
      throw new Error(
        "Instagram has no native API scheduling. Use a scheduled job to publish at the target time.",
      );
    }
    return publishInstagram(asset);
  }
  throw new Error(
    `Publishing for ${asset.platform} is not supported in this MVP (generate-only).`,
  );
}
