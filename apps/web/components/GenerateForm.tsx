"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/types";

export function GenerateForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Platform[]>([...ALL_PLATFORMS]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(platform: Platform) {
    setSelected((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  }

  async function generate() {
    if (selected.length === 0) {
      setError("Select at least one platform.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, platforms: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      router.push(`/campaigns/${data.campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold">Select platforms</h2>
        <p className="text-sm text-muted">
          The agent writes platform-specific content and a matching creative for
          each.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_PLATFORMS.map((p) => {
          const on = selected.includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={`chip cursor-pointer ${on ? "chip-on" : ""}`}
            >
              {on ? "✓ " : ""}
              {PLATFORM_LABELS[p]}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button onClick={generate} className="btn" disabled={loading}>
        {loading ? "Generating campaign…" : "Generate campaign"}
      </button>
      {loading && (
        <p className="text-xs text-muted">
          Writing copy and rendering creatives — this can take a few seconds.
        </p>
      )}
    </div>
  );
}
