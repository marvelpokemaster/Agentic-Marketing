import type {
  AssetStatus,
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
import "@/lib/firebase/client";
import { Repo, NewCampaignInput } from "./repo";
import { 
  listProducts, 
  getProduct, 
  listCampaigns, 
  getCampaign, 
  createProduct,
  createCampaign,
  createCampaignAsset,
  updateCampaignStatus,
  updateCampaignResults,
  updateCampaignAsset
} from "@/lib/dataconnect";

export class FdcRepo implements Repo {
  async createProduct(userId: string, input: ProductInput): Promise<Product> {
    const res = await createProduct({
      name: input.name,
      description: input.description,
      features: input.features,
      targetAudience: input.target_audience,
      industry: input.industry,
      imageUrls: input.image_urls,
    });
    
    // Fetch it back to get the generated ID and timestamps
    const prod = await getProduct({ id: res.data.product_insert.id });
    if (!prod.data.product) throw new Error("Product creation failed");
    
    return {
      id: prod.data.product.id,
      user_id: prod.data.product.userId,
      name: prod.data.product.name,
      description: prod.data.product.description,
      features: prod.data.product.features as string[],
      target_audience: prod.data.product.targetAudience,
      industry: prod.data.product.industry,
      logo_url: prod.data.product.logoUrl ?? null,
      image_urls: prod.data.product.imageUrls as string[],
      created_at: prod.data.product.createdAt as string,
    };
  }

  async listProducts(userId: string): Promise<Product[]> {
    const res = await listProducts();
    return res.data.products.map((p) => ({
      id: p.id,
      user_id: p.userId,
      name: p.name,
      description: p.description,
      features: p.features as string[],
      target_audience: p.targetAudience,
      industry: p.industry,
      logo_url: p.logoUrl ?? null,
      image_urls: p.imageUrls as string[],
      created_at: p.createdAt as string,
    }));
  }

  async getProduct(userId: string, id: string): Promise<Product | null> {
    const res = await getProduct({ id });
    const p = res.data.product;
    if (!p || p.userId !== userId) return null;
    return {
      id: p.id,
      user_id: p.userId,
      name: p.name,
      description: p.description,
      features: p.features as string[],
      target_audience: p.targetAudience,
      industry: p.industry,
      logo_url: p.logoUrl ?? null,
      image_urls: p.imageUrls as string[],
      created_at: p.createdAt as string,
    };
  }

  async createCampaign(userId: string, input: NewCampaignInput): Promise<Campaign> {
    const res = await createCampaign({
      productId: input.product.id,
      productName: input.product.name,
      platforms: input.platforms,
      status: "draft",
      workflow: input.workflow,
      config: input.config,
      results: input.results,
    });

    const campaignId = res.data.campaign_insert.id;

    if (input.assets && input.assets.length > 0) {
      await Promise.all(
        input.assets.map((asset) =>
          createCampaignAsset({
            campaignId: campaignId,
            platform: asset.platform,
            headline: asset.headline,
            body: asset.body,
            hashtags: asset.hashtags,
            cta: asset.cta,
            creativePrompt: asset.creative_prompt,
            status: asset.status,
          })
        )
      );
    }

    const campRes = await getCampaign({ id: campaignId });
    if (!campRes.data.campaign) throw new Error("Campaign creation failed");
    return this._mapCampaign(campRes.data.campaign);
  }

  async listCampaigns(userId: string): Promise<Campaign[]> {
    const res = await listCampaigns();
    return res.data.campaigns.map((c) => this._mapCampaign(c));
  }

  async getCampaign(userId: string, id: string): Promise<Campaign | null> {
    const res = await getCampaign({ id });
    const c = res.data.campaign;
    if (!c || c.userId !== userId) return null;
    return this._mapCampaign(c);
  }

  async updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
    await updateCampaignStatus({ id: campaignId, status });
  }

  async updateCampaignResults(
    campaignId: string,
    results: CampaignResults,
    status?: CampaignStatus,
  ): Promise<Campaign> {
    await updateCampaignResults({
      id: campaignId,
      results: results,
      status: status, // Might be undefined
    });
    
    // We should probably get it again to be safe
    const campRes = await getCampaign({ id: campaignId });
    if (!campRes.data.campaign) throw new Error("Campaign not found");
    return this._mapCampaign(campRes.data.campaign);
  }

  async updateAsset(
    campaignId: string,
    assetId: string,
    patch: Partial<CampaignAsset>,
  ): Promise<CampaignAsset | null> {
    await updateCampaignAsset({
      id: assetId,
      headline: patch.headline,
      body: patch.body,
      hashtags: patch.hashtags,
      cta: patch.cta,
      creativeUrl: patch.creative_url,
      status: patch.status,
      scheduledTime: patch.scheduled_time ? patch.scheduled_time : undefined, // FDC treats Timestamp as string
      externalId: patch.external_id,
      error: patch.error,
    });
    
    const campRes = await getCampaign({ id: campaignId });
    const asset = campRes.data.campaign?.campaignAssets_on_campaign?.find((a: any) => a.id === assetId);
    if (!asset) return null;

    return {
      id: asset.id,
      campaign_id: campaignId,
      platform: asset.platform as Platform,
      headline: asset.headline,
      body: asset.body,
      hashtags: asset.hashtags as string[],
      cta: asset.cta,
      creative_prompt: asset.creativePrompt,
      creative_url: asset.creativeUrl ?? null,
      status: asset.status as AssetStatus,
      scheduled_time: asset.scheduledTime as string | null,
      external_id: asset.externalId ?? null,
      error: asset.error ?? null,
    };
  }

  private _mapCampaign(c: any): Campaign {
    return {
      id: c.id,
      user_id: c.userId,
      product_id: c.product.id,
      product_name: c.productName,
      platforms: c.platforms as Platform[],
      status: c.status as CampaignStatus,
      created_at: c.createdAt as string,
      workflow: c.workflow as WorkflowType,
      config: c.config as any,
      results: c.results as any,
      assets: c.campaignAssets_on_campaign?.map((a: any) => ({
        id: a.id,
        campaign_id: c.id,
        platform: a.platform as Platform,
        headline: a.headline,
        body: a.body,
        hashtags: a.hashtags as string[],
        cta: a.cta,
        creative_prompt: a.creativePrompt,
        creative_url: a.creativeUrl ?? null,
        status: a.status as AssetStatus,
        scheduled_time: a.scheduledTime as string | null,
        external_id: a.externalId ?? null,
        error: a.error ?? null,
      })) ?? [],
    };
  }
}
