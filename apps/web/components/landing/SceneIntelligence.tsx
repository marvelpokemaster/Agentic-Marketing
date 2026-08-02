"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatRow } from "@/components/ui/StatRow";
import { NetworkGraph } from "@/components/ui/NetworkGraph";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Activity, Database, Share2 } from "lucide-react";
import type { CompetitorResult } from "@/lib/types";

interface SceneIntelligenceProps {
  stats: { value: string; label: string; detail: string }[];
  firebase: boolean;
  meta: boolean;
}

const MOCK_INTELLIGENCE_QUERIES = [
  "AI marketing automation tools",
  "stateless multi-agent workflows",
  "Meta Graph API auto publishing",
  "competitor positioning analysis",
  "B2B lead enrichment pipeline",
];

const MOCK_COMPETITOR_SITES: CompetitorResult[] = [
  { name: "HubSpot", domain: "hubspot.com" },
  { name: "Jasper AI", domain: "jasper.ai" },
  { name: "Copy.ai", domain: "copy.ai" },
  { name: "Sprout Social", domain: "sproutsocial.com" },
  { name: "Hootsuite", domain: "hootsuite.com" },
];

export function SceneIntelligence({ stats, firebase, meta }: SceneIntelligenceProps) {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 md:px-10">
      <SectionHeader
        badge="Live Telemetry"
        title="Real-Time Intelligence & Metrics"
        subtitle="Live metrics, automated market signal collection, and health status for workspace data nodes and social APIs."
      />

      {/* StatRow Counters */}
      <div className="mt-12 rounded-xl border border-border bg-panel p-6 shadow-sm">
        <StatRow stats={stats} />
      </div>

      {/* Market Intelligence Network Graph & Node Status */}
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-2">
        {/* Network Graph */}
        <GlassPanel className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-muted">
            <Activity className="h-4 w-4 text-primary" />
            <span>Market Intelligence Graph</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Live search query expansion and competitor domain discovery executed by the Research Agent via SerpAPI.
          </p>
          <NetworkGraph
            queries={MOCK_INTELLIGENCE_QUERIES}
            competitors={MOCK_COMPETITOR_SITES}
          />
        </GlassPanel>

        {/* Integration Status Telemetry */}
        <GlassPanel className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-muted">
            <Database className="h-4 w-4 text-accent" />
            <span>Integration Telemetry Node</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Automatic status verification of workspace data nodes and social broadcasting APIs on page load.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-panel border border-border text-primary">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground block">Firebase Storage</span>
                  <span className="font-mono text-[10px] text-muted block">Campaign Data & Image Store</span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-md font-mono text-xs font-semibold ${
                  firebase
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}
              >
                {firebase ? "Connected" : "Local Mode"}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-panel border border-border text-accent">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground block">Meta Graph Relay</span>
                  <span className="font-mono text-[10px] text-muted block">Instagram & Facebook Publishing</span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-md font-mono text-xs font-semibold ${
                  meta
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}
              >
                {meta ? "Configured" : "Demo Mode"}
              </span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
