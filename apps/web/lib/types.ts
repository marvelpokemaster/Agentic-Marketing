export type Platform = "instagram" | "facebook" | "linkedin";

export const ALL_PLATFORMS: Platform[] = ["instagram", "facebook", "linkedin"];

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string;
  features: string[];
  target_audience: string;
  industry: string;
  logo_url: string | null;
  image_urls: string[];
  created_at: string;
}

export interface ProductInput {
  name: string;
  description: string;
  features: string[];
  target_audience: string;
  industry: string;
  logo_url?: string | null;
  image_urls?: string[];
}

export type CampaignStatus = "draft" | "ready" | "partially_published" | "published";

export type AssetStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export interface CampaignAsset {
  id: string;
  campaign_id: string;
  platform: Platform;
  /** Headline or hook (used for LinkedIn banner / IG title). */
  headline: string;
  /** Main caption or post body. */
  body: string;
  hashtags: string[];
  cta: string;
  creative_prompt: string;
  creative_url: string | null;
  status: AssetStatus;
  scheduled_time: string | null;
  external_id: string | null;
  error: string | null;
}

export interface Campaign {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  platforms: Platform[];
  status: CampaignStatus;
  created_at: string;
  assets: CampaignAsset[];
}

export interface CurrentUser {
  id: string;
  email: string | null;
  isDemo: boolean;
}
