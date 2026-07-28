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
import { FirestoreRepo } from "./firestore-repo";

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
  cached = new FirestoreRepo();
  return cached;
}

/**
 * Create a request-scoped `Repo` for use in Next.js Server Components and API Routes.
 * This uses the Firebase Admin SDK to ensure writes do not hang in Node.js environments.
 */
export async function getServerRepo(): Promise<Repo> {
  const { getFirebaseAdminApp } = await import("@/lib/firebase/admin");
  const { getFirestore } = await import("firebase-admin/firestore");
  const { AdminFirestoreRepo } = await import("./admin-firestore-repo");
  
  const app = getFirebaseAdminApp();
  // Using the named database 'marketing'
  const db = getFirestore(app, "marketing");
  return new AdminFirestoreRepo(db);
}
