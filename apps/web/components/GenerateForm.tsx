"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/types";
import { Card } from "./ui/Card";
import { AnimatedButton } from "./ui/AnimatedButton";
import { Rocket, AlertTriangle, Sparkles, MapPin, Search } from "lucide-react";
import { playUISound } from "@/lib/audio";

export function GenerateForm({ productId }: { productId: string }) {
  const router = useRouter();

  const [workflow, setWorkflow] = useState<"organic_campaign" | "lead_generation">("organic_campaign");
  const [selected, setSelected] = useState<Platform[]>(["instagram", "facebook"]);

  // B2B Lead Gen Specific Inputs
  const [location, setLocation] = useState("Indiranagar, Bangalore");
  const [nicheQuery, setNicheQuery] = useState("Cafes & Bakeries");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (p: Platform) => {
    if (selected.includes(p)) {
      if (selected.length > 1) {
        setSelected(selected.filter((item) => item !== p));
      }
    } else {
      setSelected([...selected, p]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (workflow === "organic_campaign" && selected.length === 0) return;
    if (workflow === "lead_generation" && (!location.trim() || !nicheQuery.trim())) return;

    setLoading(true);
    setError(null);
    playUISound("agent_start");

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          workflow,
          platforms: workflow === "organic_campaign" ? selected : undefined,
          target_location: workflow === "lead_generation" ? location : undefined,
          niche_query: workflow === "lead_generation" ? nicheQuery : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.detail || "Failed to create campaign");
      }

      router.push(`/campaigns/${data.campaign.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-6">
      {/* Workflow Tabs */}
      <div className="border-b border-border/40 pb-1 flex gap-6">
        <button
          type="button"
          onClick={() => !loading && setWorkflow("organic_campaign")}
          className={`pb-3 font-heading font-bold text-xs uppercase tracking-wider transition-all relative ${
            workflow !== "lead_generation" ? "text-primary" : "text-muted hover:text-foreground"
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
            workflow === "lead_generation" ? "text-primary" : "text-muted hover:text-foreground"
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
            <h4 className="font-heading text-sm font-bold text-foreground">Target Social Networks</h4>
            <p className="font-sans text-xs text-muted">
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
                    on ? "bg-primary/15 border-primary/40 text-primary shadow-sm" : "bg-surface border-border text-muted hover:border-primary/30"
                  }`}
                  disabled={loading}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-primary" : "bg-muted/40"}`} />
                  {PLATFORM_LABELS[p]}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <h4 className="font-heading text-sm font-bold text-foreground">B2B Prospecting Parameters</h4>
            <p className="font-sans text-xs text-muted">
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
              <label className="label">Niche or Category *</label>
              <input
                type="text"
                placeholder="e.g. Cafes & Bakeries"
                className="input font-mono text-xs"
                value={nicheQuery}
                onChange={(e) => setNicheQuery(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-500 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="pt-2">
        <AnimatedButton
          type="submit"
          variant="primary"
          size="lg"
          isLoading={loading}
          icon={workflow === "lead_generation" ? <Search className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}
          className="w-full"
        >
          {loading
            ? "Initializing Multi-Agent Pipeline..."
            : workflow === "lead_generation"
            ? "Launch B2B Lead Discovery"
            : "Orchestrate Campaign Pipeline"}
        </AnimatedButton>
      </form>
    </Card>
  );
}
