# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `default`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListProducts*](#listproducts)
  - [*GetProduct*](#getproduct)
  - [*ListCampaigns*](#listcampaigns)
  - [*GetCampaign*](#getcampaign)
- [**Mutations**](#mutations)
  - [*CreateProduct*](#createproduct)
  - [*CreateCampaign*](#createcampaign)
  - [*CreateCampaignAsset*](#createcampaignasset)
  - [*UpdateCampaignStatus*](#updatecampaignstatus)
  - [*UpdateCampaignResults*](#updatecampaignresults)
  - [*UpdateCampaignAsset*](#updatecampaignasset)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `default`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@agentic-marketing/dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@agentic-marketing/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@agentic-marketing/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `default` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListProducts
You can execute the `ListProducts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listProducts(options?: ExecuteQueryOptions): QueryPromise<ListProductsData, undefined>;

interface ListProductsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProductsData, undefined>;
}
export const listProductsRef: ListProductsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProducts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProductsData, undefined>;

interface ListProductsRef {
  ...
  (dc: DataConnect): QueryRef<ListProductsData, undefined>;
}
export const listProductsRef: ListProductsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listProductsRef:
```typescript
const name = listProductsRef.operationName;
console.log(name);
```

### Variables
The `ListProducts` query has no variables.
### Return Type
Recall that executing the `ListProducts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListProductsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListProducts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProducts } from '@agentic-marketing/dataconnect';


// Call the `listProducts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProducts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProducts(dataConnect);

console.log(data.products);

// Or, you can use the `Promise` API.
listProducts().then((response) => {
  const data = response.data;
  console.log(data.products);
});
```

### Using `ListProducts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listProductsRef } from '@agentic-marketing/dataconnect';


// Call the `listProductsRef()` function to get a reference to the query.
const ref = listProductsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listProductsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.products);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.products);
});
```

## GetProduct
You can execute the `GetProduct` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
getProduct(vars: GetProductVariables, options?: ExecuteQueryOptions): QueryPromise<GetProductData, GetProductVariables>;

interface GetProductRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProductVariables): QueryRef<GetProductData, GetProductVariables>;
}
export const getProductRef: GetProductRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getProduct(dc: DataConnect, vars: GetProductVariables, options?: ExecuteQueryOptions): QueryPromise<GetProductData, GetProductVariables>;

interface GetProductRef {
  ...
  (dc: DataConnect, vars: GetProductVariables): QueryRef<GetProductData, GetProductVariables>;
}
export const getProductRef: GetProductRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getProductRef:
```typescript
const name = getProductRef.operationName;
console.log(name);
```

### Variables
The `GetProduct` query requires an argument of type `GetProductVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetProductVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetProduct` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetProductData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetProduct`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getProduct, GetProductVariables } from '@agentic-marketing/dataconnect';

// The `GetProduct` query requires an argument of type `GetProductVariables`:
const getProductVars: GetProductVariables = {
  id: ..., 
};

// Call the `getProduct()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getProduct(getProductVars);
// Variables can be defined inline as well.
const { data } = await getProduct({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getProduct(dataConnect, getProductVars);

console.log(data.product);

// Or, you can use the `Promise` API.
getProduct(getProductVars).then((response) => {
  const data = response.data;
  console.log(data.product);
});
```

### Using `GetProduct`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getProductRef, GetProductVariables } from '@agentic-marketing/dataconnect';

// The `GetProduct` query requires an argument of type `GetProductVariables`:
const getProductVars: GetProductVariables = {
  id: ..., 
};

// Call the `getProductRef()` function to get a reference to the query.
const ref = getProductRef(getProductVars);
// Variables can be defined inline as well.
const ref = getProductRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getProductRef(dataConnect, getProductVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.product);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.product);
});
```

## ListCampaigns
You can execute the `ListCampaigns` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listCampaigns(options?: ExecuteQueryOptions): QueryPromise<ListCampaignsData, undefined>;

interface ListCampaignsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListCampaignsData, undefined>;
}
export const listCampaignsRef: ListCampaignsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCampaigns(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListCampaignsData, undefined>;

interface ListCampaignsRef {
  ...
  (dc: DataConnect): QueryRef<ListCampaignsData, undefined>;
}
export const listCampaignsRef: ListCampaignsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCampaignsRef:
```typescript
const name = listCampaignsRef.operationName;
console.log(name);
```

### Variables
The `ListCampaigns` query has no variables.
### Return Type
Recall that executing the `ListCampaigns` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCampaignsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListCampaigns`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCampaigns } from '@agentic-marketing/dataconnect';


// Call the `listCampaigns()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCampaigns();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCampaigns(dataConnect);

console.log(data.campaigns);

// Or, you can use the `Promise` API.
listCampaigns().then((response) => {
  const data = response.data;
  console.log(data.campaigns);
});
```

### Using `ListCampaigns`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCampaignsRef } from '@agentic-marketing/dataconnect';


// Call the `listCampaignsRef()` function to get a reference to the query.
const ref = listCampaignsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCampaignsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.campaigns);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.campaigns);
});
```

## GetCampaign
You can execute the `GetCampaign` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
getCampaign(vars: GetCampaignVariables, options?: ExecuteQueryOptions): QueryPromise<GetCampaignData, GetCampaignVariables>;

interface GetCampaignRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCampaignVariables): QueryRef<GetCampaignData, GetCampaignVariables>;
}
export const getCampaignRef: GetCampaignRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCampaign(dc: DataConnect, vars: GetCampaignVariables, options?: ExecuteQueryOptions): QueryPromise<GetCampaignData, GetCampaignVariables>;

interface GetCampaignRef {
  ...
  (dc: DataConnect, vars: GetCampaignVariables): QueryRef<GetCampaignData, GetCampaignVariables>;
}
export const getCampaignRef: GetCampaignRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCampaignRef:
```typescript
const name = getCampaignRef.operationName;
console.log(name);
```

### Variables
The `GetCampaign` query requires an argument of type `GetCampaignVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCampaignVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetCampaign` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCampaignData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetCampaign`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCampaign, GetCampaignVariables } from '@agentic-marketing/dataconnect';

// The `GetCampaign` query requires an argument of type `GetCampaignVariables`:
const getCampaignVars: GetCampaignVariables = {
  id: ..., 
};

// Call the `getCampaign()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCampaign(getCampaignVars);
// Variables can be defined inline as well.
const { data } = await getCampaign({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCampaign(dataConnect, getCampaignVars);

console.log(data.campaign);

// Or, you can use the `Promise` API.
getCampaign(getCampaignVars).then((response) => {
  const data = response.data;
  console.log(data.campaign);
});
```

### Using `GetCampaign`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCampaignRef, GetCampaignVariables } from '@agentic-marketing/dataconnect';

// The `GetCampaign` query requires an argument of type `GetCampaignVariables`:
const getCampaignVars: GetCampaignVariables = {
  id: ..., 
};

// Call the `getCampaignRef()` function to get a reference to the query.
const ref = getCampaignRef(getCampaignVars);
// Variables can be defined inline as well.
const ref = getCampaignRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCampaignRef(dataConnect, getCampaignVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.campaign);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.campaign);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `default` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateProduct
You can execute the `CreateProduct` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
createProduct(vars: CreateProductVariables): MutationPromise<CreateProductData, CreateProductVariables>;

interface CreateProductRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateProductVariables): MutationRef<CreateProductData, CreateProductVariables>;
}
export const createProductRef: CreateProductRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createProduct(dc: DataConnect, vars: CreateProductVariables): MutationPromise<CreateProductData, CreateProductVariables>;

interface CreateProductRef {
  ...
  (dc: DataConnect, vars: CreateProductVariables): MutationRef<CreateProductData, CreateProductVariables>;
}
export const createProductRef: CreateProductRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createProductRef:
```typescript
const name = createProductRef.operationName;
console.log(name);
```

### Variables
The `CreateProduct` mutation requires an argument of type `CreateProductVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateProductVariables {
  name: string;
  description: string;
  features: unknown;
  targetAudience: string;
  industry: string;
  imageUrls: unknown;
}
```
### Return Type
Recall that executing the `CreateProduct` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateProductData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateProductData {
  product_insert: Product_Key;
}
```
### Using `CreateProduct`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createProduct, CreateProductVariables } from '@agentic-marketing/dataconnect';

// The `CreateProduct` mutation requires an argument of type `CreateProductVariables`:
const createProductVars: CreateProductVariables = {
  name: ..., 
  description: ..., 
  features: ..., 
  targetAudience: ..., 
  industry: ..., 
  imageUrls: ..., 
};

// Call the `createProduct()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createProduct(createProductVars);
// Variables can be defined inline as well.
const { data } = await createProduct({ name: ..., description: ..., features: ..., targetAudience: ..., industry: ..., imageUrls: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createProduct(dataConnect, createProductVars);

console.log(data.product_insert);

// Or, you can use the `Promise` API.
createProduct(createProductVars).then((response) => {
  const data = response.data;
  console.log(data.product_insert);
});
```

### Using `CreateProduct`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createProductRef, CreateProductVariables } from '@agentic-marketing/dataconnect';

// The `CreateProduct` mutation requires an argument of type `CreateProductVariables`:
const createProductVars: CreateProductVariables = {
  name: ..., 
  description: ..., 
  features: ..., 
  targetAudience: ..., 
  industry: ..., 
  imageUrls: ..., 
};

// Call the `createProductRef()` function to get a reference to the mutation.
const ref = createProductRef(createProductVars);
// Variables can be defined inline as well.
const ref = createProductRef({ name: ..., description: ..., features: ..., targetAudience: ..., industry: ..., imageUrls: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createProductRef(dataConnect, createProductVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.product_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.product_insert);
});
```

## CreateCampaign
You can execute the `CreateCampaign` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
createCampaign(vars: CreateCampaignVariables): MutationPromise<CreateCampaignData, CreateCampaignVariables>;

interface CreateCampaignRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCampaignVariables): MutationRef<CreateCampaignData, CreateCampaignVariables>;
}
export const createCampaignRef: CreateCampaignRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCampaign(dc: DataConnect, vars: CreateCampaignVariables): MutationPromise<CreateCampaignData, CreateCampaignVariables>;

interface CreateCampaignRef {
  ...
  (dc: DataConnect, vars: CreateCampaignVariables): MutationRef<CreateCampaignData, CreateCampaignVariables>;
}
export const createCampaignRef: CreateCampaignRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCampaignRef:
```typescript
const name = createCampaignRef.operationName;
console.log(name);
```

### Variables
The `CreateCampaign` mutation requires an argument of type `CreateCampaignVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCampaignVariables {
  productId: UUIDString;
  productName: string;
  platforms: unknown;
  status: string;
  workflow: string;
  config: unknown;
  results: unknown;
}
```
### Return Type
Recall that executing the `CreateCampaign` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCampaignData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCampaignData {
  campaign_insert: Campaign_Key;
}
```
### Using `CreateCampaign`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCampaign, CreateCampaignVariables } from '@agentic-marketing/dataconnect';

// The `CreateCampaign` mutation requires an argument of type `CreateCampaignVariables`:
const createCampaignVars: CreateCampaignVariables = {
  productId: ..., 
  productName: ..., 
  platforms: ..., 
  status: ..., 
  workflow: ..., 
  config: ..., 
  results: ..., 
};

// Call the `createCampaign()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCampaign(createCampaignVars);
// Variables can be defined inline as well.
const { data } = await createCampaign({ productId: ..., productName: ..., platforms: ..., status: ..., workflow: ..., config: ..., results: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCampaign(dataConnect, createCampaignVars);

console.log(data.campaign_insert);

// Or, you can use the `Promise` API.
createCampaign(createCampaignVars).then((response) => {
  const data = response.data;
  console.log(data.campaign_insert);
});
```

### Using `CreateCampaign`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCampaignRef, CreateCampaignVariables } from '@agentic-marketing/dataconnect';

// The `CreateCampaign` mutation requires an argument of type `CreateCampaignVariables`:
const createCampaignVars: CreateCampaignVariables = {
  productId: ..., 
  productName: ..., 
  platforms: ..., 
  status: ..., 
  workflow: ..., 
  config: ..., 
  results: ..., 
};

// Call the `createCampaignRef()` function to get a reference to the mutation.
const ref = createCampaignRef(createCampaignVars);
// Variables can be defined inline as well.
const ref = createCampaignRef({ productId: ..., productName: ..., platforms: ..., status: ..., workflow: ..., config: ..., results: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCampaignRef(dataConnect, createCampaignVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.campaign_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.campaign_insert);
});
```

## CreateCampaignAsset
You can execute the `CreateCampaignAsset` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
createCampaignAsset(vars: CreateCampaignAssetVariables): MutationPromise<CreateCampaignAssetData, CreateCampaignAssetVariables>;

interface CreateCampaignAssetRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCampaignAssetVariables): MutationRef<CreateCampaignAssetData, CreateCampaignAssetVariables>;
}
export const createCampaignAssetRef: CreateCampaignAssetRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCampaignAsset(dc: DataConnect, vars: CreateCampaignAssetVariables): MutationPromise<CreateCampaignAssetData, CreateCampaignAssetVariables>;

interface CreateCampaignAssetRef {
  ...
  (dc: DataConnect, vars: CreateCampaignAssetVariables): MutationRef<CreateCampaignAssetData, CreateCampaignAssetVariables>;
}
export const createCampaignAssetRef: CreateCampaignAssetRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCampaignAssetRef:
```typescript
const name = createCampaignAssetRef.operationName;
console.log(name);
```

### Variables
The `CreateCampaignAsset` mutation requires an argument of type `CreateCampaignAssetVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateCampaignAsset` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCampaignAssetData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCampaignAssetData {
  campaignAsset_insert: CampaignAsset_Key;
}
```
### Using `CreateCampaignAsset`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCampaignAsset, CreateCampaignAssetVariables } from '@agentic-marketing/dataconnect';

// The `CreateCampaignAsset` mutation requires an argument of type `CreateCampaignAssetVariables`:
const createCampaignAssetVars: CreateCampaignAssetVariables = {
  campaignId: ..., 
  platform: ..., 
  headline: ..., 
  body: ..., 
  hashtags: ..., 
  cta: ..., 
  creativePrompt: ..., 
  status: ..., 
};

// Call the `createCampaignAsset()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCampaignAsset(createCampaignAssetVars);
// Variables can be defined inline as well.
const { data } = await createCampaignAsset({ campaignId: ..., platform: ..., headline: ..., body: ..., hashtags: ..., cta: ..., creativePrompt: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCampaignAsset(dataConnect, createCampaignAssetVars);

console.log(data.campaignAsset_insert);

// Or, you can use the `Promise` API.
createCampaignAsset(createCampaignAssetVars).then((response) => {
  const data = response.data;
  console.log(data.campaignAsset_insert);
});
```

### Using `CreateCampaignAsset`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCampaignAssetRef, CreateCampaignAssetVariables } from '@agentic-marketing/dataconnect';

// The `CreateCampaignAsset` mutation requires an argument of type `CreateCampaignAssetVariables`:
const createCampaignAssetVars: CreateCampaignAssetVariables = {
  campaignId: ..., 
  platform: ..., 
  headline: ..., 
  body: ..., 
  hashtags: ..., 
  cta: ..., 
  creativePrompt: ..., 
  status: ..., 
};

// Call the `createCampaignAssetRef()` function to get a reference to the mutation.
const ref = createCampaignAssetRef(createCampaignAssetVars);
// Variables can be defined inline as well.
const ref = createCampaignAssetRef({ campaignId: ..., platform: ..., headline: ..., body: ..., hashtags: ..., cta: ..., creativePrompt: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCampaignAssetRef(dataConnect, createCampaignAssetVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.campaignAsset_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.campaignAsset_insert);
});
```

## UpdateCampaignStatus
You can execute the `UpdateCampaignStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateCampaignStatus(vars: UpdateCampaignStatusVariables): MutationPromise<UpdateCampaignStatusData, UpdateCampaignStatusVariables>;

interface UpdateCampaignStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCampaignStatusVariables): MutationRef<UpdateCampaignStatusData, UpdateCampaignStatusVariables>;
}
export const updateCampaignStatusRef: UpdateCampaignStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateCampaignStatus(dc: DataConnect, vars: UpdateCampaignStatusVariables): MutationPromise<UpdateCampaignStatusData, UpdateCampaignStatusVariables>;

interface UpdateCampaignStatusRef {
  ...
  (dc: DataConnect, vars: UpdateCampaignStatusVariables): MutationRef<UpdateCampaignStatusData, UpdateCampaignStatusVariables>;
}
export const updateCampaignStatusRef: UpdateCampaignStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateCampaignStatusRef:
```typescript
const name = updateCampaignStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateCampaignStatus` mutation requires an argument of type `UpdateCampaignStatusVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateCampaignStatusVariables {
  id: UUIDString;
  status: string;
}
```
### Return Type
Recall that executing the `UpdateCampaignStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateCampaignStatusData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateCampaignStatusData {
  campaign_update?: Campaign_Key | null;
}
```
### Using `UpdateCampaignStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateCampaignStatus, UpdateCampaignStatusVariables } from '@agentic-marketing/dataconnect';

// The `UpdateCampaignStatus` mutation requires an argument of type `UpdateCampaignStatusVariables`:
const updateCampaignStatusVars: UpdateCampaignStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateCampaignStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateCampaignStatus(updateCampaignStatusVars);
// Variables can be defined inline as well.
const { data } = await updateCampaignStatus({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateCampaignStatus(dataConnect, updateCampaignStatusVars);

console.log(data.campaign_update);

// Or, you can use the `Promise` API.
updateCampaignStatus(updateCampaignStatusVars).then((response) => {
  const data = response.data;
  console.log(data.campaign_update);
});
```

### Using `UpdateCampaignStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateCampaignStatusRef, UpdateCampaignStatusVariables } from '@agentic-marketing/dataconnect';

// The `UpdateCampaignStatus` mutation requires an argument of type `UpdateCampaignStatusVariables`:
const updateCampaignStatusVars: UpdateCampaignStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateCampaignStatusRef()` function to get a reference to the mutation.
const ref = updateCampaignStatusRef(updateCampaignStatusVars);
// Variables can be defined inline as well.
const ref = updateCampaignStatusRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateCampaignStatusRef(dataConnect, updateCampaignStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.campaign_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.campaign_update);
});
```

## UpdateCampaignResults
You can execute the `UpdateCampaignResults` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateCampaignResults(vars: UpdateCampaignResultsVariables): MutationPromise<UpdateCampaignResultsData, UpdateCampaignResultsVariables>;

interface UpdateCampaignResultsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCampaignResultsVariables): MutationRef<UpdateCampaignResultsData, UpdateCampaignResultsVariables>;
}
export const updateCampaignResultsRef: UpdateCampaignResultsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateCampaignResults(dc: DataConnect, vars: UpdateCampaignResultsVariables): MutationPromise<UpdateCampaignResultsData, UpdateCampaignResultsVariables>;

interface UpdateCampaignResultsRef {
  ...
  (dc: DataConnect, vars: UpdateCampaignResultsVariables): MutationRef<UpdateCampaignResultsData, UpdateCampaignResultsVariables>;
}
export const updateCampaignResultsRef: UpdateCampaignResultsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateCampaignResultsRef:
```typescript
const name = updateCampaignResultsRef.operationName;
console.log(name);
```

### Variables
The `UpdateCampaignResults` mutation requires an argument of type `UpdateCampaignResultsVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateCampaignResultsVariables {
  id: UUIDString;
  results: unknown;
  status?: string | null;
}
```
### Return Type
Recall that executing the `UpdateCampaignResults` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateCampaignResultsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateCampaignResultsData {
  campaign_update?: Campaign_Key | null;
}
```
### Using `UpdateCampaignResults`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateCampaignResults, UpdateCampaignResultsVariables } from '@agentic-marketing/dataconnect';

// The `UpdateCampaignResults` mutation requires an argument of type `UpdateCampaignResultsVariables`:
const updateCampaignResultsVars: UpdateCampaignResultsVariables = {
  id: ..., 
  results: ..., 
  status: ..., // optional
};

// Call the `updateCampaignResults()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateCampaignResults(updateCampaignResultsVars);
// Variables can be defined inline as well.
const { data } = await updateCampaignResults({ id: ..., results: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateCampaignResults(dataConnect, updateCampaignResultsVars);

console.log(data.campaign_update);

// Or, you can use the `Promise` API.
updateCampaignResults(updateCampaignResultsVars).then((response) => {
  const data = response.data;
  console.log(data.campaign_update);
});
```

### Using `UpdateCampaignResults`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateCampaignResultsRef, UpdateCampaignResultsVariables } from '@agentic-marketing/dataconnect';

// The `UpdateCampaignResults` mutation requires an argument of type `UpdateCampaignResultsVariables`:
const updateCampaignResultsVars: UpdateCampaignResultsVariables = {
  id: ..., 
  results: ..., 
  status: ..., // optional
};

// Call the `updateCampaignResultsRef()` function to get a reference to the mutation.
const ref = updateCampaignResultsRef(updateCampaignResultsVars);
// Variables can be defined inline as well.
const ref = updateCampaignResultsRef({ id: ..., results: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateCampaignResultsRef(dataConnect, updateCampaignResultsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.campaign_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.campaign_update);
});
```

## UpdateCampaignAsset
You can execute the `UpdateCampaignAsset` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateCampaignAsset(vars: UpdateCampaignAssetVariables): MutationPromise<UpdateCampaignAssetData, UpdateCampaignAssetVariables>;

interface UpdateCampaignAssetRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCampaignAssetVariables): MutationRef<UpdateCampaignAssetData, UpdateCampaignAssetVariables>;
}
export const updateCampaignAssetRef: UpdateCampaignAssetRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateCampaignAsset(dc: DataConnect, vars: UpdateCampaignAssetVariables): MutationPromise<UpdateCampaignAssetData, UpdateCampaignAssetVariables>;

interface UpdateCampaignAssetRef {
  ...
  (dc: DataConnect, vars: UpdateCampaignAssetVariables): MutationRef<UpdateCampaignAssetData, UpdateCampaignAssetVariables>;
}
export const updateCampaignAssetRef: UpdateCampaignAssetRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateCampaignAssetRef:
```typescript
const name = updateCampaignAssetRef.operationName;
console.log(name);
```

### Variables
The `UpdateCampaignAsset` mutation requires an argument of type `UpdateCampaignAssetVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateCampaignAsset` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateCampaignAssetData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateCampaignAssetData {
  campaignAsset_update?: CampaignAsset_Key | null;
}
```
### Using `UpdateCampaignAsset`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateCampaignAsset, UpdateCampaignAssetVariables } from '@agentic-marketing/dataconnect';

// The `UpdateCampaignAsset` mutation requires an argument of type `UpdateCampaignAssetVariables`:
const updateCampaignAssetVars: UpdateCampaignAssetVariables = {
  id: ..., 
  headline: ..., // optional
  body: ..., // optional
  hashtags: ..., // optional
  cta: ..., // optional
  creativeUrl: ..., // optional
  status: ..., // optional
  scheduledTime: ..., // optional
  externalId: ..., // optional
  error: ..., // optional
};

// Call the `updateCampaignAsset()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateCampaignAsset(updateCampaignAssetVars);
// Variables can be defined inline as well.
const { data } = await updateCampaignAsset({ id: ..., headline: ..., body: ..., hashtags: ..., cta: ..., creativeUrl: ..., status: ..., scheduledTime: ..., externalId: ..., error: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateCampaignAsset(dataConnect, updateCampaignAssetVars);

console.log(data.campaignAsset_update);

// Or, you can use the `Promise` API.
updateCampaignAsset(updateCampaignAssetVars).then((response) => {
  const data = response.data;
  console.log(data.campaignAsset_update);
});
```

### Using `UpdateCampaignAsset`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateCampaignAssetRef, UpdateCampaignAssetVariables } from '@agentic-marketing/dataconnect';

// The `UpdateCampaignAsset` mutation requires an argument of type `UpdateCampaignAssetVariables`:
const updateCampaignAssetVars: UpdateCampaignAssetVariables = {
  id: ..., 
  headline: ..., // optional
  body: ..., // optional
  hashtags: ..., // optional
  cta: ..., // optional
  creativeUrl: ..., // optional
  status: ..., // optional
  scheduledTime: ..., // optional
  externalId: ..., // optional
  error: ..., // optional
};

// Call the `updateCampaignAssetRef()` function to get a reference to the mutation.
const ref = updateCampaignAssetRef(updateCampaignAssetVars);
// Variables can be defined inline as well.
const ref = updateCampaignAssetRef({ id: ..., headline: ..., body: ..., hashtags: ..., cta: ..., creativeUrl: ..., status: ..., scheduledTime: ..., externalId: ..., error: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateCampaignAssetRef(dataConnect, updateCampaignAssetVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.campaignAsset_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.campaignAsset_update);
});
```

