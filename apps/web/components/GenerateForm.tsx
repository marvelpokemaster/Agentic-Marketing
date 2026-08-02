"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/types";
import { AnimatedButton } from "./ui/AnimatedButton";
import { Rocket, AlertTriangle, Search } from "lucide-react";
import { playUISound } from "@/lib/audio";
import { motion } from "framer-motion";

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

  const isLeadGen = workflow === "lead_generation";

  return (
    <div>
      {/* Workflow tabs */}
      <div className="flex gap-8 border-b border-border">
        {[
          { id: "organic_campaign", label: "Organic social" },
          { id: "lead_generation", label: "Lead generation" },
        ].map((tab) => {
          const active = isLeadGen
            ? tab.id === "lead_generation"
            : tab.id === "organic_campaign";
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !loading && setWorkflow(tab.id as typeof workflow)}
              disabled={loading}
              className={`relative -mb-px pb-3 text-[13px] font-medium transition-colors ${
                active
                  ? "text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              {active && (
                <motion.span
                  layoutId="generateFormTab"
                  className="absolute bottom-0 left-0 h-[2px] w-full rounded-full"
                  style={{ background: "var(--gradient-primary)" }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="py-8">
        {!isLeadGen ? (
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Target platforms
            </h3>
            <p className="prose-col mt-2 text-sm leading-relaxed text-muted">
              The content agent writes a separate headline, caption, CTA, and hashtag set
              for each platform you select.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((p) => {
                const on = selected.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => !loading && toggle(p)}
                    disabled={loading}
                    className={`inline-flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-all ${
                      on
                        ? "border-primary/30 bg-primary/5 text-primary shadow-[0_0_12px_var(--glow-color)]"
                        : "border-border bg-glass-bg text-muted backdrop-blur-sm hover:border-border-hover hover:text-foreground"
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      {on && <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />}
                      <span className={`relative h-2 w-2 rounded-full ${on ? "bg-primary" : "bg-muted/30"}`} />
                    </span>
                    {PLATFORM_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Prospecting parameters
            </h3>
            <p className="prose-col mt-2 text-sm leading-relaxed text-muted">
              The system searches local businesses matching this niche and location, scores
              them for fit, and drafts personalized outreach for each.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label">Location *</label>
                <input
                  type="text"
                  placeholder="Indiranagar, Bangalore"
                  className="input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">Niche or category *</label>
                <input
                  type="text"
                  placeholder="Cafes & Bakeries"
                  className="input"
                  value={nicheQuery}
                  onChange={(e) => setNicheQuery(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 p-3 text-xs font-medium text-danger backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-border pt-8">
        <AnimatedButton
          type="submit"
          variant="primary"
          size="lg"
          isLoading={loading}
          icon={isLeadGen ? <Search className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}
        >
          {loading
            ? "Starting…"
            : isLeadGen
            ? "Find leads"
            : "Create campaign"}
        </AnimatedButton>
      </form>
    </div>
  );
}
