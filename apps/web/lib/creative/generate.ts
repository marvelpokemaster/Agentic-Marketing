import type { Platform } from "@/lib/types";

const provider = (process.env.CREATIVE_PROVIDER ?? "pollinations").toLowerCase();
const apiKey = process.env.CREATIVE_PROVIDER_API_KEY ?? "";

/** Recommended creative dimensions per platform. */
export const CREATIVE_SIZES: Record<Platform, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1080 },
  facebook: { width: 1200, height: 630 },
  linkedin: { width: 1200, height: 627 },
};

function pollinationsUrl(prompt: string, platform: Platform, seed: number): string {
  const { width, height } = CREATIVE_SIZES[platform];
  const encoded = encodeURIComponent(prompt.slice(0, 480));
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
}

async function openAiImage(prompt: string, platform: Platform): Promise<string> {
  const size =
    platform === "instagram" ? "1024x1024" : "1792x1024";
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: "gpt-image-1", prompt, size, n: 1 }),
  });
  if (!res.ok) throw new Error(`OpenAI image HTTP ${res.status}`);
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  const url = data?.data?.[0]?.url;
  if (url) return url;
  if (b64) return `data:image/png;base64,${b64}`;
  throw new Error("OpenAI image: empty response");
}

async function stabilityImage(prompt: string): Promise<string> {
  const res = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/core",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: (() => {
        const form = new FormData();
        form.append("prompt", prompt);
        form.append("output_format", "png");
        return form;
      })(),
    },
  );
  if (!res.ok) throw new Error(`Stability HTTP ${res.status}`);
  const data = await res.json();
  if (data?.image) return `data:image/png;base64,${data.image}`;
  throw new Error("Stability: empty response");
}

/**
 * Bounded retries to verify Pollinations image generation readiness and optional persistent storage.
 */
export async function verifyAndPrepareImage(
  url: string,
  platform: Platform,
  retries = 3,
  backoffMs = 2000
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "image/png";
        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        if (buffer.length > 500) {
          // Attempt persistent Firebase Storage upload if available
          try {
            const { uploadBuffer } = await import("@/lib/storage/upload");
            const storageUrl = await uploadBuffer(buffer, contentType, `${platform}.png`, "creatives");
            if (storageUrl) return storageUrl;
          } catch (storageErr) {
            console.warn("[creative] Firebase Storage upload skipped/failed, using verified Pollinations URL:", storageErr);
          }
          // Fallback to verified Pollinations URL (now warm in Pollinations cache)
          return url;
        }
      }
    } catch (err) {
      console.warn(`[creative] Image readiness check attempt ${attempt}/${retries} failed:`, err);
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw new Error("Generated image is unavailable or non-responsive from provider after retries.");
}

/**
 * Generate a creative image URL for a platform. Falls back to Pollinations
 * (free, keyless) when a paid provider is unavailable or fails.
 */
export async function generateCreative(
  prompt: string,
  platform: Platform,
  seed = Math.floor(Math.random() * 1_000_000),
): Promise<string> {
  try {
    if (provider === "openai" && apiKey) return await openAiImage(prompt, platform);
    if (provider === "stability" && apiKey) return await stabilityImage(prompt);
  } catch (err) {
    console.error("[creative] provider failed, using pollinations:", err);
  }
  const rawUrl = pollinationsUrl(prompt, platform, seed);
  return await verifyAndPrepareImage(rawUrl, platform);
}
