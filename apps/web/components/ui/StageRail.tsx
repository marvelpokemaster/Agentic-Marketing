"use client";

import React, { useEffect, useState, useRef } from "react";
import { Sparkles, Search, Cpu, Target, FileText, Image as ImageIcon, CheckCircle2, Loader2 } from "lucide-react";
import { loadGsap } from "@/lib/motion/registerGsap";

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

  const containerRef = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // GSAP animations for active shimmer and completed node pulse
  useEffect(() => {
    let ctx: any = null;

    loadGsap().then((instances) => {
      if (!instances) return;
      const { gsap } = instances;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Active stage shimmer sweep
        if (shimmerRef.current && isExecuting) {
          gsap.fromTo(
            shimmerRef.current,
            { xPercent: -100 },
            {
              xPercent: 100,
              duration: 1.2,
              repeat: -1,
              ease: "none",
            }
          );
        }

        // Pulse completed stage node on stage transition
        const nodeEl = nodeRefs.current[activeIdx - 1];
        if (nodeEl) {
          gsap.fromTo(
            nodeEl,
            { scale: 1 },
            {
              scale: 1.06,
              duration: 0.2,
              yoyo: true,
              repeat: 1,
              ease: "power1.inOut",
              clearProps: "transform",
            }
          );
        }
      });

      ctx = mm;
    });

    return () => {
      if (ctx && typeof ctx.revert === "function") {
        ctx.revert();
      }
    };
  }, [activeIdx, isExecuting]);

  return (
    <div ref={containerRef} className="w-full space-y-5">
      {/* 6-Stage Horizontal Rail */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          const isDone = idx < activeIdx;
          const isActive = idx === activeIdx && isExecuting;

          return (
            <div
              key={s.id}
              ref={(el) => {
                nodeRefs.current[idx] = el;
              }}
              className={`relative flex flex-col items-center justify-between rounded-2xl border p-4 transition-all duration-300 backdrop-blur-md ${
                isActive
                  ? "border-primary/30 bg-primary/8 shadow-glow scale-[1.02]"
                  : isDone
                  ? "border-success/20 bg-success/5"
                  : "border-border bg-glass-bg opacity-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.5))" }} />
                ) : isActive ? (
                  <span className="spinner-gradient shrink-0" />
                ) : (
                  <Icon className="h-4 w-4 shrink-0 text-muted" />
                )}
                <span
                  className={`font-mono text-xs font-semibold uppercase tracking-wider ${
                    isActive
                      ? "text-primary"
                      : isDone
                      ? "text-success"
                      : "text-muted"
                  }`}
                >
                  {s.label}
                </span>
              </div>

              {/* Active Shimmer Sweep Bar */}
              {isActive && (
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-primary/15">
                  <div
                    ref={shimmerRef}
                    className="h-full w-1/2 rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rotating Microcopy Banner */}
      {isExecuting && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-primary/15 bg-glass-bg px-5 py-3.5 backdrop-blur-xl shadow-glow">
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
