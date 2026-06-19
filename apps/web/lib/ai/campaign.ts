import type { Platform, Product } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/types";
import { callLLM } from "./llm";

export interface PlatformContent {
  headline: string;
  body: string;
  hashtags: string[];
  cta: string;
  creative_prompt: string;
}

const PLATFORM_GUIDE: Record<Platform, string> = {
  instagram:
    "Instagram: punchy, emoji-friendly caption (max ~125 words), strong CTA, and 12-18 hashtags optimized for discovery.",
  facebook:
    "Facebook: conversational post (~80-120 words), clear CTA, and 3-5 focused hashtags (Facebook reach relies less on tags).",
  linkedin:
    "LinkedIn: professional, value-driven post (~100-150 words), credible CTA, no heavy emoji, and 4-6 professional hashtags.",
};

const HASHTAG_TARGET: Record<Platform, string> = {
  instagram: "12-18",
  facebook: "3-5",
  linkedin: "4-6",
};

function hashtagStrategy(platforms: Platform[]): string {
  const counts = platforms
    .map((p) => `- ${PLATFORM_LABELS[p]}: ${HASHTAG_TARGET[p]} hashtags`)
    .join("\n");
  return `HASHTAG STRATEGY (critical for reach)
Generate a tiered mix per platform so posts reach both broad and targeted audiences:
${counts}

For each platform's hashtag set, blend these tiers:
1. Broad/high-volume tags for reach (e.g. #marketing, #smallbusiness) — keep relevant.
2. Niche/long-tail tags for intent and lower competition (combine product + audience + use-case).
3. Branded tags derived from the product/company name (e.g. #${"{ProductName}"}).
4. Community/audience tags the target audience actually follows (location, role, interest).
5. 1-2 trending/seasonal tags only if genuinely relevant.

Rules:
- Each hashtag: single token, camelCase or lowercase, NO "#" prefix, NO spaces, no punctuation.
- No duplicates, no banned/spammy/engagement-bait tags (e.g. #followforfollow, #like4like).
- Make them specific to THIS product — avoid generic filler.
- Order from most relevant to broadest.
- Instagram gets the most tags; LinkedIn the fewest and most professional.`;
}

function buildPrompt(product: Product, platforms: Platform[]): string {
  const features = product.features.length
    ? product.features.join(", ")
    : "not specified";
  const guides = platforms.map((p) => `- ${PLATFORM_GUIDE[p]}`).join("\n");
  const shape = platforms
    .map(
      (p) =>
        `"${p}": { "headline": string, "body": string, "hashtags": string[], "cta": string, "creative_prompt": string }`,
    )
    .join(",\n    ");

  return `You are a senior social media marketer and growth strategist. Create ready-to-post, reach-optimized content for a product.

PRODUCT
- Name: ${product.name}
- Description: ${product.description}
- Key features: ${features}
- Target audience: ${product.target_audience || "general"}
- Industry: ${product.industry || "general"}

PLATFORM REQUIREMENTS
${guides}

${hashtagStrategy(platforms)}

For each platform also write a "creative_prompt": a vivid text-to-image prompt for an
on-brand ad visual (describe subject, style, colors, mood, composition). Do not include text overlays instructions.

Return ONLY valid JSON in this exact shape:
{
  ${shape}
}`;
}

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found");
  return JSON.parse(raw.slice(start, end + 1));
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).replace(/^#/, "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\s,]+/)
      .map((s) => s.replace(/^#/, "").trim())
      .filter(Boolean);
  }
  return [];
}

function toTag(text: string): string {
  return text
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1)))
    .join("");
}

function dedupeTags(tags: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.replace(/^#/, "").trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= limit) break;
  }
  return out;
}

const BROAD_TAGS: Record<Platform, string[]> = {
  instagram: [
    "instagood",
    "smallbusiness",
    "newlaunch",
    "trending",
    "discover",
    "musthave",
  ],
  facebook: ["smallbusiness", "newlaunch"],
  linkedin: ["innovation", "business", "growth"],
};

const TAG_LIMITS: Record<Platform, number> = {
  instagram: 16,
  facebook: 5,
  linkedin: 6,
};

/**
 * Build a tiered, reach-oriented hashtag set from product data:
 * branded → niche (audience/feature combos) → industry → broad reach tags.
 */
function fallbackHashtags(product: Product, platform: Platform): string[] {
  const name = toTag(product.name);
  const industry = toTag(product.industry || "marketing");
  const audience = toTag(product.target_audience || "");
  const featureTags = product.features.slice(0, 4).map(toTag).filter(Boolean);

  const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const branded = [name, `${name}Official`].filter(Boolean);
  const niche: string[] = [];
  if (name && industry) niche.push(`${name}${cap(industry)}`);
  if (audience) niche.push(audience, `${cap(industry)}For${cap(audience)}`);
  if (industry) niche.push(industry, `${industry}Tips`, `${industry}Community`);

  const tiered = [
    ...branded,
    ...featureTags,
    ...niche,
    ...BROAD_TAGS[platform],
  ].filter(Boolean);

  return dedupeTags(tiered, TAG_LIMITS[platform]);
}

function fallbackContent(product: Product, platform: Platform): PlatformContent {
  const feature = product.features[0] ?? product.description.slice(0, 60);
  const audience = product.target_audience || "your audience";
  const base = {
    headline: `Meet ${product.name}`,
    creative_prompt: `Modern, clean advertisement for ${product.name} in the ${
      product.industry || "tech"
    } space. ${product.description}. Bright, professional, high-contrast composition, brand-forward, no text overlay.`,
  };
  const hashtags = fallbackHashtags(product, platform);

  if (platform === "linkedin") {
    return {
      ...base,
      body: `Introducing ${product.name} — built for ${audience}. ${product.description} Key benefit: ${feature}. We built this to help teams move faster and get more value with less effort.`,
      hashtags,
      cta: "Learn more in the comments.",
    };
  }
  if (platform === "facebook") {
    return {
      ...base,
      body: `${product.name} is here! ${product.description} Perfect for ${audience}. Highlight: ${feature}. Tell us what you think 👇`,
      hashtags,
      cta: "Send us a message to get started.",
    };
  }
  return {
    ...base,
    body: `${product.name} ✨ ${product.description} Made for ${audience}. ${feature} and more 🚀`,
    hashtags,
    cta: "Tap the link in bio.",
  };
}

// Max hashtags kept from the LLM per platform (a bit more generous than fallback).
const AI_TAG_LIMITS: Record<Platform, number> = {
  instagram: 20,
  facebook: 6,
  linkedin: 8,
};

function coerce(
  raw: unknown,
  product: Product,
  platform: Platform,
): PlatformContent {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const fb = fallbackContent(product, platform);
  const aiTags = dedupeTags(asStringArray(obj.hashtags), AI_TAG_LIMITS[platform]);
  return {
    headline: typeof obj.headline === "string" && obj.headline ? obj.headline : fb.headline,
    body: typeof obj.body === "string" && obj.body ? obj.body : fb.body,
    hashtags: aiTags.length ? aiTags : fb.hashtags,
    cta: typeof obj.cta === "string" && obj.cta ? obj.cta : fb.cta,
    creative_prompt:
      typeof obj.creative_prompt === "string" && obj.creative_prompt
        ? obj.creative_prompt
        : fb.creative_prompt,
  };
}

export interface CampaignContentResult {
  content: Record<Platform, PlatformContent>;
  usedAi: boolean;
}

/**
 * Generate per-platform content. Uses the configured LLM when available and
 * falls back to deterministic copy so the flow always produces a campaign.
 */
export async function generateCampaignContent(
  product: Product,
  platforms: Platform[],
): Promise<CampaignContentResult> {
  const content = {} as Record<Platform, PlatformContent>;
  let usedAi = false;

  const text = await callLLM(buildPrompt(product, platforms));
  let parsed: Record<string, unknown> | null = null;
  if (text) {
    try {
      parsed = extractJson(text) as Record<string, unknown>;
      usedAi = true;
    } catch (err) {
      console.error("[ai] failed to parse campaign JSON:", err);
    }
  }

  for (const platform of platforms) {
    content[platform] = coerce(parsed?.[platform], product, platform);
  }

  return { content, usedAi };
}

export { PLATFORM_LABELS };
