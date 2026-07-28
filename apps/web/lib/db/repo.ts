import type {
  Campaign,
  CampaignAsset,
  CampaignStatus,
  Platform,
  Product,
  ProductInput,
  WorkflowType,
  CampaignConfig,
  CampaignResults,
} from "@/lib/types";
import { FdcRepo } from "./fdc-repo";

export interface NewCampaignInput {
  product: Product;
  platforms: Platform[];
  workflow: WorkflowType;
  config: CampaignConfig;
  results: CampaignResults;
  assets?: Omit<CampaignAsset, "id" | "campaign_id">[];
}

export interface Repo {
  createProduct(userId: string, input: ProductInput): Promise<Product>;
  listProducts(userId: string): Promise<Product[]>;
  getProduct(userId: string, id: string): Promise<Product | null>;

  createCampaign(userId: string, input: NewCampaignInput): Promise<Campaign>;
  listCampaigns(userId: string): Promise<Campaign[]>;
  getCampaign(userId: string, id: string): Promise<Campaign | null>;
  updateCampaignStatus(
    campaignId: string,
    status: CampaignStatus,
  ): Promise<void>;

  updateCampaignResults(
    campaignId: string,
    results: CampaignResults,
    status?: CampaignStatus,
  ): Promise<Campaign>;

  updateAsset(
    campaignId: string,
    assetId: string,
    patch: Partial<CampaignAsset>,
  ): Promise<CampaignAsset | null>;
}

let cached: Repo | null = null;

export function getRepo(): Repo {
  if (cached) return cached;
  cached = new FdcRepo();
  return cached;
}

/**
 * Create a request-scoped, authenticated `Repo` for use in Next.js
 * Server Components and API Route Handlers.
 *
 * This factory reads the user's Firebase ID token from the request
 * cookies (via `next-firebase-auth-edge`), creates a request-scoped
 * `FirebaseServerApp`, and injects the resulting `DataConnect` instance
 * into `FdcRepo`. The returned repo carries the user's authentication
 * context so Data Connect queries with `@auth(level: USER)` succeed
 * during SSR.
 *
 * Falls back to an unauthenticated `FdcRepo` if no valid tokens are
 * found in cookies (same behavior as `getRepo()`).
 */
export async function getServerRepo(): Promise<Repo> {
  const { getAuthenticatedDataConnect } = await import("@/lib/firebase/server");
  const dc = await getAuthenticatedDataConnect();
  return new FdcRepo(dc ?? undefined);
}

