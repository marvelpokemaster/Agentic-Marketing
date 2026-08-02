"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Search, Cpu, Target, FileText, Image as ImageIcon, CheckCircle2, Loader2 } from "lucide-react";

export interface StageRailProps {
  currentStage?: string;
  isExecuting?: boolean;
}

const STAGES = [
  {
    id: "planning",
    label: "Planning",
    icon: Sparkles,
    microcopy: [
      "Evaluating product scope and search intent...",
      "Drafting strategy parameters...",
      "Mapping campaign objective graph...",
    ],
  },
  {
    id: "researching",
    label: "Researching",
    icon: Search,
    microcopy: [
      "Executing SerpAPI market queries...",
      "Crawling competitor positioning domain signals...",
      "Extracting search volumes and trends...",
    ],
  },
  {
    id: "analyzing",
    label: "Analyzing",
    icon: Cpu,
    microcopy: [
      "Synthesizing audience personas...",
      "Identifying market gap opportunities...",
      "Scoring competitive differentiators...",
    ],
  },
  {
    id: "strategizing",
    label: "Strategizing",
    icon: Target,
    microcopy: [
      "Formulating core messaging pillars...",
      "Mapping channel distribution strategies...",
      "Structuring content hooks and calls to action...",
    ],
  },
  {
    id: "generating_content",
    label: "Content",
    icon: FileText,
    microcopy: [
      "Drafting platform-sized post captions...",
      "Generating hashtags and engagement hooks...",
      "Adapting copy for Instagram, Facebook, LinkedIn...",
    ],
  },
  {
    id: "generating_images",
    label: "Creatives",
    icon: ImageIcon,
    microcopy: [
      "Rendering platform visual assets...",
      "Validating image resolutions and prompt parameters...",
      "Finalizing multi-channel media payloads...",
    ],
  },
];

export function StageRail({ currentStage = "planning", isExecuting = true }: StageRailProps) {
  const activeIdx = Math.max(
    0,
    STAGES.findIndex((s) => s.id === currentStage)
  );

  const activeStageObj = STAGES[activeIdx] || STAGES[0];
  const [copyIdx, setCopyIdx] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion || !isExecuting) return;

    const interval = setInterval(() => {
      setCopyIdx((prev) => (prev + 1) % activeStageObj.microcopy.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [activeStageObj, isExecuting]);

  return (
    <div className="w-full space-y-6">
      {/* 6-Stage Horizontal Rail */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          const isDone = idx < activeIdx;
          const isActive = idx === activeIdx && isExecuting;
          const isPending = idx > activeIdx;

          return (
            <div
              key={s.id}
              className={`relative flex flex-col items-center justify-between rounded-xl border p-3.5 transition-all duration-300 ${
                isActive
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.02]"
                  : isDone
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                  : "border-border bg-panel/40 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <Icon className="h-4 w-4 shrink-0 text-muted" />
                )}
                <span
                  className={`font-mono text-xs font-semibold uppercase tracking-wider ${
                    isActive
                      ? "text-primary"
                      : isDone
                      ? "text-emerald-500"
                      : "text-muted"
                  }`}
                >
                  {s.label}
                </span>
              </div>

              {/* Shimmer Progress Line under active stage */}
              {isActive && (
                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-primary/20">
                  <div className="h-full w-1/2 animate-shimmer bg-primary rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rotating Microcopy Banner */}
      {isExecuting && (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-primary/20 bg-panel/80 px-4 py-3 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <p className="font-mono text-xs text-muted truncate">
            {activeStageObj.microcopy[copyIdx]}
          </p>
        </div>
      )}
    </div>
  );
}
