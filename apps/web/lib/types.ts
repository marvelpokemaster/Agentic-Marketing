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

export type CampaignStatus = "draft" | "researching" | "ready" | "partially_published" | "published" | "running" | "failed";

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
  published_url?: string | null;
  error: string | null;
}

// ── Polymorphic B2B Lead Gen Types ───────────────────────────────────────────
export interface Lead {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  source: string;
  score: number | null;
  score_reason: string | null;
  priority: "high" | "medium" | "low" | null;
  outreach: {
    email?: string;
    whatsapp?: string;
    image_url?: string | null;
    image_prompt?: string;
    image_mode?: string;
  };
  status?: string;
  error?: string | null;
}

export type WorkflowType = "organic_campaign" | "lead_generation" | "content_only";

export type CampaignConfig =
  | { workflow: "organic_campaign" | "content_only"; data: { platforms: Platform[]; instructions?: string; image_mode?: string } }
  | { workflow: "lead_generation"; data: { location: string; target_audience?: string; scrapers?: string[]; instructions?: string } };

export interface BaseEntity {
  confidence?: number | null;
  provider?: string | null;
  source_url?: string | null;
  reason?: string | null;
}

export interface CompetitorResult extends BaseEntity {
  name: string;
  domain?: string | null;
  similarity_score?: number | null;
}

export interface TrendResult extends BaseEntity {
  keyword: string;
  volume?: number | null;
  region?: string | null;
}

export interface AudienceResult extends BaseEntity {
  segment: string;
  size?: number | null;
}

export interface NewsResult extends BaseEntity {
  title: string;
  url: string;
  source: string;
  published_at?: string | null;
  summary?: string | null;
}

export interface TechnologyResult extends BaseEntity {
  name: string;
  category?: string | null;
  maturity?: string | null;
}

export interface OpportunityResult extends BaseEntity {
  opportunity: string;
}

export interface RiskResult extends BaseEntity {
  risk: string;
}

export interface ResearchMetadata {
  completed_providers: string[];
  failed_providers: string[];
  partial_providers: string[];
  execution_time: number;
  generated_at?: string;
  schema_version?: string;
}

export interface ResearchIntelligence {
  competitors: CompetitorResult[];
  audience: AudienceResult[];
  trends: TrendResult[];
  news: NewsResult[];
  technologies: TechnologyResult[];
  opportunities?: OpportunityResult[];
  risks?: RiskResult[];
}

export interface ResearchReport {
  metadata: ResearchMetadata;
  intelligence: ResearchIntelligence;
}

export interface ResearchPlan {
  search_queries: string[];
  keywords: string[];
  competitor_hypotheses: string[];
  industry_summary: string;
  research_focus: string;
}

export interface MarketingStrategy {
  campaign_objective: string;
  target_audience: string;
  value_proposition: string;
  positioning: string;
  messaging_angle: string;
  tone: string;
  content_pillars: string[];
  recommended_platforms: string[];
  organic_vs_paid: string;
  recommended_budget: string;
  cta_strategy: string;
}

export interface ExecutionStageInfo {
  status: "waiting" | "running" | "completed" | "failed";
  started_at?: string;
  finished_at?: string;
  duration?: number;
  query_progress?: string;
}

export interface ExecutionMetadata {
  current_agent: string;
  current_message: string;
  stage: "planning" | "researching" | "analyzing" | "strategizing" | "generating_content" | "generating_images" | "ready" | "failed";
  failed_stage?: string | null;
  error_message?: string | null;
  stages: Record<string, ExecutionStageInfo>;
}

export interface CampaignResults {
  assets?: CampaignAsset[];
  leads?: Lead[];
  research_report?: ResearchReport;
  planner?: ResearchPlan;
  strategy?: MarketingStrategy;
  cache_metadata?: {
    product_hash?: string;
    serp_query_count?: number;
    cache_hit?: boolean;
    generated_at?: string;
  };
  [key: string]: any;
}

export interface Campaign {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  platforms: Platform[];
  status: CampaignStatus;
  created_at: string;
  
  // Polymorphic Workflow fields
  workflow: WorkflowType;
  config: CampaignConfig;
  results: CampaignResults;
  execution?: ExecutionMetadata;

  // Legacy / Organic compatibility
  assets: CampaignAsset[];
}

export interface CurrentUser {
  id: string;
  email: string | null;
  user_metadata: Record<string, any>;
}

