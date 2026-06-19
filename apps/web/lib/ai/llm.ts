const provider = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
const apiKey = process.env.AI_PROVIDER_API_KEY ?? "";
const model = process.env.AI_MODEL ?? defaultModel(provider);

function defaultModel(p: string): string {
  switch (p) {
    case "openai":
      return "gpt-4o-mini";
    case "anthropic":
      return "claude-3-5-sonnet-latest";
    case "gemini":
    default:
      return "gemini-2.5-flash";
  }
}

export function isLlmConfigured(): boolean {
  return provider !== "demo" && Boolean(apiKey);
}

/**
 * Provider-agnostic text generation. Returns the raw model text, or null when
 * no provider is configured or the call fails (callers fall back deterministically).
 */
export async function callLLM(prompt: string): Promise<string | null> {
  if (!isLlmConfigured()) return null;
  try {
    if (provider === "gemini") return await callGemini(prompt);
    if (provider === "openai") return await callOpenAI(prompt);
    if (provider === "anthropic") return await callAnthropic(prompt);
    return null;
  } catch (err) {
    console.error("[ai] generation failed:", err);
    return null;
  }
}

async function callGemini(prompt: string): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

async function callOpenAI(prompt: string): Promise<string | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? null;
}

async function callAnthropic(prompt: string): Promise<string | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
  const data = await res.json();
  return data?.content?.[0]?.text ?? null;
}
