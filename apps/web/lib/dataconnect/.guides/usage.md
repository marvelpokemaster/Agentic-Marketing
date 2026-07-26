# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createProduct, createCampaign, createCampaignAsset, updateCampaignStatus, updateCampaignResults, updateCampaignAsset, listProducts, getProduct, listCampaigns, getCampaign } from '@agentic-marketing/dataconnect';


// Operation CreateProduct:  For variables, look at type CreateProductVars in ../index.d.ts
const { data } = await CreateProduct(dataConnect, createProductVars);

// Operation CreateCampaign:  For variables, look at type CreateCampaignVars in ../index.d.ts
const { data } = await CreateCampaign(dataConnect, createCampaignVars);

// Operation CreateCampaignAsset:  For variables, look at type CreateCampaignAssetVars in ../index.d.ts
const { data } = await CreateCampaignAsset(dataConnect, createCampaignAssetVars);

// Operation UpdateCampaignStatus:  For variables, look at type UpdateCampaignStatusVars in ../index.d.ts
const { data } = await UpdateCampaignStatus(dataConnect, updateCampaignStatusVars);

// Operation UpdateCampaignResults:  For variables, look at type UpdateCampaignResultsVars in ../index.d.ts
const { data } = await UpdateCampaignResults(dataConnect, updateCampaignResultsVars);

// Operation UpdateCampaignAsset:  For variables, look at type UpdateCampaignAssetVars in ../index.d.ts
const { data } = await UpdateCampaignAsset(dataConnect, updateCampaignAssetVars);

// Operation ListProducts: 
const { data } = await ListProducts(dataConnect);

// Operation GetProduct:  For variables, look at type GetProductVars in ../index.d.ts
const { data } = await GetProduct(dataConnect, getProductVars);

// Operation ListCampaigns: 
const { data } = await ListCampaigns(dataConnect);

// Operation GetCampaign:  For variables, look at type GetCampaignVars in ../index.d.ts
const { data } = await GetCampaign(dataConnect, getCampaignVars);


```