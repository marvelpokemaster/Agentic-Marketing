"use client";

import React from "react";
import { motion } from "framer-motion";
import { CodePanel, type CodeLine } from "@/components/ui/CodePanel";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface SceneMissionProps {
  heroLog: CodeLine[];
}

export function SceneMission({ heroLog }: SceneMissionProps) {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 md:px-10">
      <SectionHeader
        badge="Mission Command"
        title="One brief in. A published campaign out."
        subtitle="Provide product context once. Stateless agents execute research, positioning, copywriting, creative rendering, and live broadcasting sequentially."
      />

      <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Left: Mission Narrative & Process Points */}
        <div className="space-y-6">
          <GlassPanel className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-primary">01</span>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Autonomous Reason & Scrape
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Agents parse SerpAPI competitor signals, analyze GTM trends, and construct an objective-driven campaign plan without manual intervention.
            </p>
          </GlassPanel>

          <GlassPanel className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-accent">02</span>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Multi-Channel Synthesis
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Generates tailored copywriting and multi-resolution imagery specifically optimized for Instagram, Facebook, and LinkedIn feeds.
            </p>
          </GlassPanel>

          <GlassPanel className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-secondary">03</span>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Meta Graph Publishing
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Direct API publishing to live Meta channels with automatic asset validation, fallback links, and persisted status tracking.
            </p>
          </GlassPanel>
        </div>

        {/* Right: CodePanel Execution Log */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <CodePanel title="campaign · organic execution" lines={heroLog} />
        </motion.div>
      </div>
    </div>
  );
}
