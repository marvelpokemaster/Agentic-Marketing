"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_PLATFORMS, PLATFORM_LABELS, type Platform, type WorkflowType } from "@/lib/types";
import { Rocket, Share2, MapPin, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

export function GenerateForm({ productId, defaultAudience }: { productId: string; defaultAudience: string }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowType>("organic_campaign");

  // Organic Campaign state
  const [selected, setSelected] = useState<Platform[]>([...ALL_PLATFORMS]);

  // Lead Generation state
  const [location, setLocation] = useState("");
  const [targetAudience, setTargetAudience] = useState(defaultAudience || "");
  const [scrapers] = useState<string[]>(["google_maps"]);
  const [imageMode, setImageMode] = useState<"none" | "campaign" | "per_lead">("none");
  const [instructions, setInstructions] = useState("");

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
    setError(null);
    setLoading(true);
    try {
      let body: any = {
        product_id: productId,
        workflow,
      };

      if (workflow === "lead_generation") {
        if (!location.trim()) {
          throw new Error("Location is required for B2B Lead Generation.");
        }
        body.config = {
          location,
          target_audience: targetAudience,
          scrapers,
          image_mode: imageMode,
          instructions,
        };
      } else {
        if (selected.length === 0) {
          throw new Error("Select at least one platform.");
        }
        body.platforms = selected;
      }

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    <Card className="space-y-6">
      {/* Workflow Tabs */}
      <div className="border-b border-border/40 pb-1 flex gap-6">
        <button
          type="button"
          onClick={() => !loading && setWorkflow("organic_campaign")}
          className={`pb-3 font-heading font-bold text-xs uppercase tracking-wider transition-all relative ${
            workflow !== "lead_generation" ? "text-primary" : "text-muted hover:text-slate-200"
          }`}
          disabled={loading}
        >
          Organic Social Media
          {workflow !== "lead_generation" && (
            <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
          )}
        </button>
        <button
          type="button"
          onClick={() => !loading && setWorkflow("lead_generation")}
          className={`pb-3 font-heading font-bold text-xs uppercase tracking-wider transition-all relative ${
            workflow === "lead_generation" ? "text-primary" : "text-muted hover:text-slate-200"
          }`}
          disabled={loading}
        >
          B2B Lead Discovery
          {workflow === "lead_generation" && (
            <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
          )}
        </button>
      </div>

      {workflow !== "lead_generation" ? (
        <div className="space-y-4">
          <div>
            <h4 className="font-heading text-sm font-bold text-slate-100">Target Social Networks</h4>
            <p className="font-sans text-xs text-muted/70">
              Autonomous agents generate tailored marketing captions, hashtag stacks, and visual assets for each network.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {ALL_PLATFORMS.map((p) => {
              const on = selected.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => !loading && toggle(p)}
                  className={`font-mono text-xs px-4 py-2 rounded-lg border font-semibold transition-all duration-200 flex items-center gap-2 ${
                    on ? "bg-primary/15 border-primary/40 text-primary shadow-sm shadow-primary/10" : "bg-surface/40 border-border text-muted hover:border-primary/30"
                  }`}
                  disabled={loading}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-primary" : "bg-slate-600"}`} />
                  {PLATFORM_LABELS[p]}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <h4 className="font-heading text-sm font-bold text-slate-100">B2B Prospecting Parameters</h4>
            <p className="font-sans text-xs text-muted/70">
              Search local B2B prospects via Google Maps API, rank profile fit, and generate personalized outreach copy.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="label">Target Location *</label>
              <input
                type="text"
                placeholder="e.g. Indiranagar, Bangalore"
                className="input font-mono text-xs"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="label">Target Niche</label>
              <input
                type="text"
                placeholder="e.g. cafes, bakeries, co-working spaces"
                className="input font-mono text-xs"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="label">Outreach Directive Instructions</label>
              <textarea
                placeholder="e.g. Highlight wholesale pricing model and 24/7 delivery SLAs..."
                className="textarea h-24 font-sans text-xs"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <AnimatedButton
        onClick={generate}
        isLoading={loading}
        className="w-full py-3 font-bold"
        icon={<Rocket className="h-4 w-4" />}
      >
        {workflow === "lead_generation" ? "Launch Lead Discovery" : "Orchestrate Campaign"}
      </AnimatedButton>
    </Card>
  );
}
