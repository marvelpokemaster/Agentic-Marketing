import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import type {
  Campaign,
  CampaignAsset,
  CampaignStatus,
  Product,
  ProductInput,
  CampaignResults,
} from "../types";
import type { Repo, NewCampaignInput } from "./repo";

export class AdminFirestoreRepo implements Repo {
  constructor(private db: FirebaseFirestore.Firestore) {}

  async createProduct(userId: string, input: ProductInput): Promise<Product> {
    const id = uuidv4();
    const product: Product = {
      id,
      user_id: userId,
      name: input.name,
      description: input.description,
      features: input.features || [],
      target_audience: input.target_audience || "",
      industry: input.industry || "",
      logo_url: input.logo_url || null,
      image_urls: input.image_urls || [],
      created_at: new Date().toISOString(),
    };
    await this.db.collection("products").doc(id).set(product);
    return product;
  }

  async listProducts(userId: string): Promise<Product[]> {
    const snap = await this.db.collection("products")
      .where("user_id", "==", userId)
      .get();
    return snap.docs.map(doc => doc.data() as Product);
  }

  async getProduct(userId: string, id: string): Promise<Product | null> {
    const snap = await this.db.collection("products").doc(id).get();
    if (!snap.exists) return null;
    const p = snap.data() as Product;
    // Security check since Admin SDK bypasses rules
    return p.user_id === userId ? p : null;
  }

  async createCampaign(userId: string, input: NewCampaignInput): Promise<Campaign> {
    const id = uuidv4();
    const campaign: Campaign = {
      id,
      user_id: userId,
      product_id: input.product.id,
      product_name: input.product.name,
      platforms: input.platforms,
      status: "draft",
      created_at: new Date().toISOString(),
      workflow: input.workflow,
      config: input.config,
      results: input.results,
      assets: (input.assets || []).map(a => ({
        ...a,
        id: uuidv4(),
        campaign_id: id,
      })) as CampaignAsset[],
    };
    await this.db.collection("campaigns").doc(id).set(campaign);
    return campaign;
  }

  async listCampaigns(userId: string): Promise<Campaign[]> {
    const snap = await this.db.collection("campaigns")
      .where("user_id", "==", userId)
      .get();
    return snap.docs.map(doc => doc.data() as Campaign);
  }

  async getCampaign(userId: string, id: string): Promise<Campaign | null> {
    const snap = await this.db.collection("campaigns").doc(id).get();
    if (!snap.exists) return null;
    const c = snap.data() as Campaign;
    return c.user_id === userId ? c : null;
  }

  async updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
    await this.db.collection("campaigns").doc(campaignId).update({ status });
  }

  async updateCampaignResults(
    campaignId: string,
    results: CampaignResults,
    status?: CampaignStatus
  ): Promise<Campaign> {
    const update: any = { results };
    if (status) update.status = status;
    await this.db.collection("campaigns").doc(campaignId).update(update);
    const snap = await this.db.collection("campaigns").doc(campaignId).get();
    if (!snap.exists) throw new Error("Campaign not found after update");
    return snap.data() as Campaign;
  }

  async updateAsset(
    campaignId: string,
    assetId: string,
    patch: Partial<CampaignAsset>
  ): Promise<CampaignAsset | null> {
    const snap = await this.db.collection("campaigns").doc(campaignId).get();
    if (!snap.exists) return null;
    
    const campaign = snap.data() as Campaign;
    const assetIdx = campaign.assets.findIndex(a => a.id === assetId);
    if (assetIdx === -1) return null;
    
    campaign.assets[assetIdx] = { ...campaign.assets[assetIdx], ...patch };
    await this.db.collection("campaigns").doc(campaignId).update({ assets: campaign.assets });
    return campaign.assets[assetIdx];
  }
}
