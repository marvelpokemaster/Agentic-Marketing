"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Rocket, ArrowRight, Sparkles } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AICore } from "./AICore";

export function SceneCTA() {
  return (
    <div className="relative mx-auto w-full max-w-[1180px] px-6 text-center md:px-10">
      <GlassPanel className="relative overflow-hidden p-12 md:p-16">
        {/* Background Spatial AICore in CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30">
          <AICore size="cta" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ready to Deploy</span>
          </div>

          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Run your first campaign in 60 seconds.
          </h2>

          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            No complex setup, database migrations, or manual tool orchestration required. Simply provide a product brief and launch mission control.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link href="/products/new">
              <AnimatedButton
                variant="primary"
                size="lg"
                icon={<Rocket className="h-4 w-4" />}
              >
                Add Product Profile
              </AnimatedButton>
            </Link>

            <Link href="/campaigns">
              <AnimatedButton
                variant="outline"
                size="lg"
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Launch Mission Control
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
