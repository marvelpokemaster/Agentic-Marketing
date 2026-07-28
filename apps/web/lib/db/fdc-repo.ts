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
import type { DataConnect } from "firebase/data-connect";
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

/**
 * Firebase Data Connect repository implementation.
 *
 * Accepts an optional `DataConnect` instance via constructor for
 * dependency injection. When provided (server-side via `getServerRepo`),
 * all generated SDK calls use the authenticated, request-scoped instance.
 * When omitted (client-side via `getRepo`), calls fall through to the
 * default global `FirebaseApp`, preserving existing client behavior.
 */
export class FdcRepo implements Repo {
  constructor(private readonly dc?: DataConnect) {}

  async createProduct(userId: string, input: ProductInput): Promise<Product> {
    const res = this.dc
      ? await createProduct(this.dc, {
          name: input.name,
          description: input.description,
          features: input.features,
          targetAudience: input.target_audience,
          industry: input.industry,
          imageUrls: input.image_urls,
        })
      : await createProduct({
          name: input.name,
          description: input.description,
          features: input.features,
          targetAudience: input.target_audience,
          industry: input.industry,
          imageUrls: input.image_urls,
        });
    
    if (!res?.data?.product_insert?.id) {
      throw new Error("Product creation failed: no ID returned from Data Connect");
    }

    // Fetch it back to get the generated ID and timestamps
    const prod = this.dc
      ? await getProduct(this.dc, { id: res.data.product_insert.id })
      : await getProduct({ id: res.data.product_insert.id });

    if (!prod?.data?.product) throw new Error("Product creation failed: could not fetch created product");
    
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
    const res = this.dc
      ? await listProducts(this.dc)
      : await listProducts();

    if (!res?.data?.products) {
      throw new Error("Failed to list products: invalid Data Connect response");
    }

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
    const res = this.dc
      ? await getProduct(this.dc, { id })
      : await getProduct({ id });

    const p = res?.data?.product;
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
    const campaignVars = {
      productId: input.product.id,
      productName: input.product.name,
      platforms: input.platforms,
      status: "draft",
      workflow: input.workflow,
      config: input.config,
      results: input.results,
    };

    const res = this.dc
      ? await createCampaign(this.dc, campaignVars)
      : await createCampaign(campaignVars);

    if (!res?.data?.campaign_insert?.id) {
      throw new Error("Campaign creation failed: no ID returned from Data Connect");
    }

    const campaignId = res.data.campaign_insert.id;

    if (input.assets && input.assets.length > 0) {
      await Promise.all(
        input.assets.map((asset) => {
          const assetVars = {
            campaignId: campaignId,
            platform: asset.platform,
            headline: asset.headline,
            body: asset.body,
            hashtags: asset.hashtags,
            cta: asset.cta,
            creativePrompt: asset.creative_prompt,
            status: asset.status,
          };
          return this.dc
            ? createCampaignAsset(this.dc, assetVars)
            : createCampaignAsset(assetVars);
        })
      );
    }

    const campRes = this.dc
      ? await getCampaign(this.dc, { id: campaignId })
      : await getCampaign({ id: campaignId });

    if (!campRes?.data?.campaign) throw new Error("Campaign creation failed: could not fetch created campaign");
    return this._mapCampaign(campRes.data.campaign);
  }

  async listCampaigns(userId: string): Promise<Campaign[]> {
    const res = this.dc
      ? await listCampaigns(this.dc)
      : await listCampaigns();

    if (!res?.data?.campaigns) {
      throw new Error("Failed to list campaigns: invalid Data Connect response");
    }

    return res.data.campaigns.map((c) => this._mapCampaign(c));
  }

  async getCampaign(userId: string, id: string): Promise<Campaign | null> {
    const res = this.dc
      ? await getCampaign(this.dc, { id })
      : await getCampaign({ id });

    const c = res?.data?.campaign;
    if (!c || c.userId !== userId) return null;
    return this._mapCampaign(c);
  }

  async updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
    if (this.dc) {
      await updateCampaignStatus(this.dc, { id: campaignId, status });
    } else {
      await updateCampaignStatus({ id: campaignId, status });
    }
  }

  async updateCampaignResults(
    campaignId: string,
    results: CampaignResults,
    status?: CampaignStatus,
  ): Promise<Campaign> {
    const updateVars = {
      id: campaignId,
      results: results,
      status: status,
    };

    if (this.dc) {
      await updateCampaignResults(this.dc, updateVars);
    } else {
      await updateCampaignResults(updateVars);
    }
    
    const campRes = this.dc
      ? await getCampaign(this.dc, { id: campaignId })
      : await getCampaign({ id: campaignId });

    if (!campRes?.data?.campaign) throw new Error("Campaign not found after update");
    return this._mapCampaign(campRes.data.campaign);
  }

  async updateAsset(
    campaignId: string,
    assetId: string,
    patch: Partial<CampaignAsset>,
  ): Promise<CampaignAsset | null> {
    const updateVars = {
      id: assetId,
      headline: patch.headline,
      body: patch.body,
      hashtags: patch.hashtags,
      cta: patch.cta,
      creativeUrl: patch.creative_url,
      status: patch.status,
      scheduledTime: patch.scheduled_time ? patch.scheduled_time : undefined,
      externalId: patch.external_id,
      error: patch.error,
    };

    if (this.dc) {
      await updateCampaignAsset(this.dc, updateVars);
    } else {
      await updateCampaignAsset(updateVars);
    }
    
    const campRes = this.dc
      ? await getCampaign(this.dc, { id: campaignId })
      : await getCampaign({ id: campaignId });

    const asset = campRes?.data?.campaign?.campaignAssets_on_campaign?.find((a: any) => a.id === assetId);
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
      product_id: c.product?.id ?? null,
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
