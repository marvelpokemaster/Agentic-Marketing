import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from '@firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CampaignAsset_Key {
  id: UUIDString;
  __typename?: 'CampaignAsset_Key';
}

export interface Campaign_Key {
  id: UUIDString;
  __typename?: 'Campaign_Key';
}

export interface CreateCampaignAssetData {
  campaignAsset_insert: CampaignAsset_Key;
}

export interface CreateCampaignAssetVariables {
  campaignId: UUIDString;
  platform: string;
  headline: string;
  body: string;
  hashtags: unknown;
  cta: string;
  creativePrompt: string;
  status: string;
}

export interface CreateCampaignData {
  campaign_insert: Campaign_Key;
}

export interface CreateCampaignVariables {
  productId: UUIDString;
  productName: string;
  platforms: unknown;
  status: string;
  workflow: string;
  config: unknown;
  results: unknown;
}

export interface CreateProductData {
  product_insert: Product_Key;
}

export interface CreateProductVariables {
  name: string;
  description: string;
  features: unknown;
  targetAudience: string;
  industry: string;
  imageUrls: unknown;
}

export interface GetCampaignData {
  campaign?: {
    id: UUIDString;
    userId: string;
    product: {
      id: UUIDString;
      name: string;
    } & Product_Key;
    productName: string;
    platforms: unknown;
    status: string;
    createdAt: TimestampString;
    workflow: string;
    config: unknown;
    results: unknown;
    campaignAssets_on_campaign: ({
      id: UUIDString;
      platform: string;
      headline: string;
      body: string;
      hashtags: unknown;
      cta: string;
      creativePrompt: string;
      creativeUrl?: string | null;
      status: string;
      scheduledTime?: TimestampString | null;
      externalId?: string | null;
      error?: string | null;
    } & CampaignAsset_Key)[];
  } & Campaign_Key;
}

export interface GetCampaignVariables {
  id: UUIDString;
}

export interface GetProductData {
  product?: {
    id: UUIDString;
    userId: string;
    name: string;
    description: string;
    features: unknown;
    targetAudience: string;
    industry: string;
    logoUrl?: string | null;
    imageUrls: unknown;
    createdAt: TimestampString;
  } & Product_Key;
}

export interface GetProductVariables {
  id: UUIDString;
}

export interface ListCampaignsData {
  campaigns: ({
    id: UUIDString;
    userId: string;
    product: {
      id: UUIDString;
      name: string;
    } & Product_Key;
    productName: string;
    platforms: unknown;
    status: string;
    createdAt: TimestampString;
    workflow: string;
    config: unknown;
    results: unknown;
  } & Campaign_Key)[];
}

export interface ListProductsData {
  products: ({
    id: UUIDString;
    userId: string;
    name: string;
    description: string;
    features: unknown;
    targetAudience: string;
    industry: string;
    logoUrl?: string | null;
    imageUrls: unknown;
    createdAt: TimestampString;
  } & Product_Key)[];
}

export interface Product_Key {
  id: UUIDString;
  __typename?: 'Product_Key';
}

export interface UpdateCampaignAssetData {
  campaignAsset_update?: CampaignAsset_Key | null;
}

export interface UpdateCampaignAssetVariables {
  id: UUIDString;
  headline?: string | null;
  body?: string | null;
  hashtags?: unknown | null;
  cta?: string | null;
  creativeUrl?: string | null;
  status?: string | null;
  scheduledTime?: TimestampString | null;
  externalId?: string | null;
  error?: string | null;
}

export interface UpdateCampaignResultsData {
  campaign_update?: Campaign_Key | null;
}

export interface UpdateCampaignResultsVariables {
  id: UUIDString;
  results: unknown;
  status?: string | null;
}

export interface UpdateCampaignStatusData {
  campaign_update?: Campaign_Key | null;
}

export interface UpdateCampaignStatusVariables {
  id: UUIDString;
  status: string;
}

interface CreateProductRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateProductVariables): MutationRef<CreateProductData, CreateProductVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateProductVariables): MutationRef<CreateProductData, CreateProductVariables>;
  operationName: string;
}
export const createProductRef: CreateProductRef;

export function createProduct(vars: CreateProductVariables): MutationPromise<CreateProductData, CreateProductVariables>;
export function createProduct(dc: DataConnect, vars: CreateProductVariables): MutationPromise<CreateProductData, CreateProductVariables>;

interface CreateCampaignRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCampaignVariables): MutationRef<CreateCampaignData, CreateCampaignVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCampaignVariables): MutationRef<CreateCampaignData, CreateCampaignVariables>;
  operationName: string;
}
export const createCampaignRef: CreateCampaignRef;

export function createCampaign(vars: CreateCampaignVariables): MutationPromise<CreateCampaignData, CreateCampaignVariables>;
export function createCampaign(dc: DataConnect, vars: CreateCampaignVariables): MutationPromise<CreateCampaignData, CreateCampaignVariables>;

interface CreateCampaignAssetRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCampaignAssetVariables): MutationRef<CreateCampaignAssetData, CreateCampaignAssetVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCampaignAssetVariables): MutationRef<CreateCampaignAssetData, CreateCampaignAssetVariables>;
  operationName: string;
}
export const createCampaignAssetRef: CreateCampaignAssetRef;

export function createCampaignAsset(vars: CreateCampaignAssetVariables): MutationPromise<CreateCampaignAssetData, CreateCampaignAssetVariables>;
export function createCampaignAsset(dc: DataConnect, vars: CreateCampaignAssetVariables): MutationPromise<CreateCampaignAssetData, CreateCampaignAssetVariables>;

interface UpdateCampaignStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCampaignStatusVariables): MutationRef<UpdateCampaignStatusData, UpdateCampaignStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCampaignStatusVariables): MutationRef<UpdateCampaignStatusData, UpdateCampaignStatusVariables>;
  operationName: string;
}
export const updateCampaignStatusRef: UpdateCampaignStatusRef;

export function updateCampaignStatus(vars: UpdateCampaignStatusVariables): MutationPromise<UpdateCampaignStatusData, UpdateCampaignStatusVariables>;
export function updateCampaignStatus(dc: DataConnect, vars: UpdateCampaignStatusVariables): MutationPromise<UpdateCampaignStatusData, UpdateCampaignStatusVariables>;

interface UpdateCampaignResultsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCampaignResultsVariables): MutationRef<UpdateCampaignResultsData, UpdateCampaignResultsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCampaignResultsVariables): MutationRef<UpdateCampaignResultsData, UpdateCampaignResultsVariables>;
  operationName: string;
}
export const updateCampaignResultsRef: UpdateCampaignResultsRef;

export function updateCampaignResults(vars: UpdateCampaignResultsVariables): MutationPromise<UpdateCampaignResultsData, UpdateCampaignResultsVariables>;
export function updateCampaignResults(dc: DataConnect, vars: UpdateCampaignResultsVariables): MutationPromise<UpdateCampaignResultsData, UpdateCampaignResultsVariables>;

interface UpdateCampaignAssetRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCampaignAssetVariables): MutationRef<UpdateCampaignAssetData, UpdateCampaignAssetVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCampaignAssetVariables): MutationRef<UpdateCampaignAssetData, UpdateCampaignAssetVariables>;
  operationName: string;
}
export const updateCampaignAssetRef: UpdateCampaignAssetRef;

export function updateCampaignAsset(vars: UpdateCampaignAssetVariables): MutationPromise<UpdateCampaignAssetData, UpdateCampaignAssetVariables>;
export function updateCampaignAsset(dc: DataConnect, vars: UpdateCampaignAssetVariables): MutationPromise<UpdateCampaignAssetData, UpdateCampaignAssetVariables>;

interface ListProductsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProductsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListProductsData, undefined>;
  operationName: string;
}
export const listProductsRef: ListProductsRef;

export function listProducts(options?: ExecuteQueryOptions): QueryPromise<ListProductsData, undefined>;
export function listProducts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProductsData, undefined>;

interface GetProductRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProductVariables): QueryRef<GetProductData, GetProductVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetProductVariables): QueryRef<GetProductData, GetProductVariables>;
  operationName: string;
}
export const getProductRef: GetProductRef;

export function getProduct(vars: GetProductVariables, options?: ExecuteQueryOptions): QueryPromise<GetProductData, GetProductVariables>;
export function getProduct(dc: DataConnect, vars: GetProductVariables, options?: ExecuteQueryOptions): QueryPromise<GetProductData, GetProductVariables>;

interface ListCampaignsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListCampaignsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListCampaignsData, undefined>;
  operationName: string;
}
export const listCampaignsRef: ListCampaignsRef;

export function listCampaigns(options?: ExecuteQueryOptions): QueryPromise<ListCampaignsData, undefined>;
export function listCampaigns(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListCampaignsData, undefined>;

interface GetCampaignRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCampaignVariables): QueryRef<GetCampaignData, GetCampaignVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCampaignVariables): QueryRef<GetCampaignData, GetCampaignVariables>;
  operationName: string;
}
export const getCampaignRef: GetCampaignRef;

export function getCampaign(vars: GetCampaignVariables, options?: ExecuteQueryOptions): QueryPromise<GetCampaignData, GetCampaignVariables>;
export function getCampaign(dc: DataConnect, vars: GetCampaignVariables, options?: ExecuteQueryOptions): QueryPromise<GetCampaignData, GetCampaignVariables>;

