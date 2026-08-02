"use client";

import React, { useRef, useEffect } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TimelineNode } from "@/components/ui/TimelineNode";
import { Brain, Search, BarChart3, Target, FileText, Image } from "lucide-react";
import { loadGsap } from "@/lib/motion/registerGsap";

const PIPELINE_STAGES = [
  {
    step: "01",
    label: "Planner Stage",
    agent: "Planner Agent",
    icon: Brain,
    desc: "Drafts 5 distinct search intents and structures campaign scope.",
  },
  {
    step: "02",
    label: "Research Stage",
    agent: "Research Agent",
    icon: Search,
    desc: "Queries SerpAPI for live market signals and competitor sites.",
  },
  {
    step: "03",
    label: "Analyst Stage",
    agent: "Analyst Agent",
    icon: BarChart3,
    desc: "Synthesizes market gaps, audience personas, and positioning angles.",
  },
  {
    step: "04",
    label: "Strategy Stage",
    agent: "Strategy Agent",
    icon: Target,
    desc: "Formulates messaging pillars and channel distribution strategy.",
  },
  {
    step: "05",
    label: "Content Stage",
    agent: "Content Agent",
    icon: FileText,
    desc: "Generates platform-tailored headlines, captions, hashtags, and CTAs.",
  },
  {
    step: "06",
    label: "Creative Stage",
    agent: "Creative Agent",
    icon: Image,
    desc: "Renders platform-sized visual assets and image prompts.",
  },
];

export function ScenePipeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: any = null;

    loadGsap().then((instances) => {
      if (!instances) return;
      const { gsap } = instances;

      const el = gridRef.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = Array.from(el.children);
        gsap.fromTo(
          cards,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "power2.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true,
            },
          }
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        const cards = Array.from(el.children);
        gsap.fromTo(
          cards,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.2,
            clearProps: "all",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              once: true,
            },
          }
        );
      });

      ctx = mm;
    });

    return () => {
      if (ctx && typeof ctx.revert === "function") {
        ctx.revert();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-[1180px] px-6 md:px-10">
      <SectionHeader
        badge="Capability Pipeline"
        title="Sequential Multi-Agent Architecture"
        subtitle="Six specialized AI agents working in sequence, each consuming upstream state and writing structured findings to the campaign record."
      />

      {/* Grid of Agent Nodes with GSAP ScrollTrigger Entrance */}
      <div ref={gridRef} className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PIPELINE_STAGES.map((stage, idx) => {
          return (
            <div key={stage.step}>
              <TimelineNode
                label={stage.label}
                agent={stage.agent}
                desc={stage.desc}
                status={idx < 4 ? "completed" : "idle"}
                index={idx}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
