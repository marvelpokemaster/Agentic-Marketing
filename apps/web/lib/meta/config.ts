export const metaGraphVersion = process.env.META_GRAPH_VERSION ?? "v21.0";
export const metaAccessToken = process.env.META_ACCESS_TOKEN ?? "";
export const metaPageId = process.env.META_PAGE_ID ?? "";
export const metaIgUserId = process.env.META_IG_USER_ID ?? "";

export function isMetaConfigured(): boolean {
  return Boolean(metaAccessToken && (metaPageId || metaIgUserId));
}

export function metaGraphUrl(path: string): string {
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `https://graph.facebook.com/${metaGraphVersion}/${clean}`;
}
