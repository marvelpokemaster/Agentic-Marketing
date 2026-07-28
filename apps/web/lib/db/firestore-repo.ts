import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { getFirestore, Firestore } from "firebase/firestore";
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
  AssetStatus,
} from "@/lib/types";
import { Repo, NewCampaignInput } from "./repo";
import { v4 as uuidv4 } from "uuid";

export class FirestoreRepo implements Repo {
  private db: Firestore;

  constructor(db?: Firestore) {
    if (db) {
      this.db = db;
    } else {
      const { app } = require("@/lib/firebase/client");
      this.db = getFirestore(app);
    }
  }

  async createProduct(userId: string, input: ProductInput): Promise<Product> {
    const id = uuidv4();
    const product: Product = {
      id,
      user_id: userId,
      name: input.name,
      description: input.description,
      features: input.features,
      target_audience: input.target_audience,
      industry: input.industry,
      logo_url: null,
      image_urls: input.image_urls || [],
      created_at: new Date().toISOString(),
    };
    await setDoc(doc(this.db, "products", id), product);
    return product;
  }

  async listProducts(userId: string): Promise<Product[]> {
    const q = query(
      collection(this.db, "products"),
      where("user_id", "==", userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Product);
  }

  async getProduct(userId: string, id: string): Promise<Product | null> {
    const snap = await getDoc(doc(this.db, "products", id));
    if (!snap.exists()) return null;
    const p = snap.data() as Product;
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
    await setDoc(doc(this.db, "campaigns", id), campaign);
    return campaign;
  }

  async listCampaigns(userId: string): Promise<Campaign[]> {
    const q = query(
      collection(this.db, "campaigns"),
      where("user_id", "==", userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Campaign);
  }

  async getCampaign(userId: string, id: string): Promise<Campaign | null> {
    const snap = await getDoc(doc(this.db, "campaigns", id));
    if (!snap.exists()) return null;
    const c = snap.data() as Campaign;
    return c.user_id === userId ? c : null;
  }

  async updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
    await updateDoc(doc(this.db, "campaigns", campaignId), { status });
  }

  async updateCampaignResults(
    campaignId: string,
    results: CampaignResults,
    status?: CampaignStatus
  ): Promise<Campaign> {
    const update: any = { results };
    if (status) update.status = status;
    await updateDoc(doc(this.db, "campaigns", campaignId), update);
    const snap = await getDoc(doc(this.db, "campaigns", campaignId));
    if (!snap.exists()) throw new Error("Campaign not found after update");
    return snap.data() as Campaign;
  }

  async updateAsset(
    campaignId: string,
    assetId: string,
    patch: Partial<CampaignAsset>
  ): Promise<CampaignAsset | null> {
    const snap = await getDoc(doc(this.db, "campaigns", campaignId));
    if (!snap.exists()) return null;
    const campaign = snap.data() as Campaign;
    const assetIdx = campaign.assets.findIndex(a => a.id === assetId);
    if (assetIdx === -1) return null;
    
    campaign.assets[assetIdx] = { ...campaign.assets[assetIdx], ...patch };
    await updateDoc(doc(this.db, "campaigns", campaignId), { assets: campaign.assets });
    return campaign.assets[assetIdx];
  }
}
