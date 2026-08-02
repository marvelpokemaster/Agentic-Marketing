"use client";

import React from "react";
import { AmbientCanvas } from "./AmbientCanvas";
import { useScrollProgress } from "./useScrollProgress";
import { ScrollScene } from "./ScrollScene";
import { SceneHero } from "./SceneHero";
import { SceneMission } from "./SceneMission";
import { ScenePipeline } from "./ScenePipeline";
import { SceneIntelligence } from "./SceneIntelligence";
import { SceneCTA } from "./SceneCTA";
import { type CodeLine } from "@/components/ui/CodePanel";

interface LandingExperienceProps {
  heroLog: CodeLine[];
  stats: { value: string; label: string; detail: string }[];
  firebase: boolean;
  meta: boolean;
}

export function LandingExperience({
  heroLog,
  stats,
  firebase,
  meta,
}: LandingExperienceProps) {
  const { scrollVelocity } = useScrollProgress();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Scene 0 — Ambient Canvas Particle Background */}
      <AmbientCanvas />

      {/* Scene 1 — HERO */}
      <ScrollScene id="hero" showDivider={true}>
        <SceneHero velocity={scrollVelocity} />
      </ScrollScene>

      {/* Scene 2 — MISSION */}
      <ScrollScene id="mission" showDivider={true}>
        <SceneMission heroLog={heroLog} />
      </ScrollScene>

      {/* Scene 3 — AI PIPELINE */}
      <ScrollScene id="pipeline" showDivider={true}>
        <ScenePipeline />
      </ScrollScene>

      {/* Scene 4 — LIVE INTELLIGENCE */}
      <ScrollScene id="intelligence" showDivider={true}>
        <SceneIntelligence stats={stats} firebase={firebase} meta={meta} />
      </ScrollScene>

      {/* Scene 5 — DEMO CTA */}
      <ScrollScene id="cta" showDivider={false}>
        <SceneCTA />
      </ScrollScene>
    </div>
  );
}
