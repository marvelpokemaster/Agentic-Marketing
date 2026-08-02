"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { TimelineNode } from "@/components/ui/TimelineNode";
import { Brain, Search, BarChart3, Target, FileText, Image } from "lucide-react";

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
  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 md:px-10">
      <SectionHeader
        badge="Capability Pipeline"
        title="Sequential Multi-Agent Architecture"
        subtitle="Six specialized AI agents working in sequence, each consuming upstream state and writing structured findings to the campaign record."
      />

      {/* Grid of Agent Nodes */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PIPELINE_STAGES.map((stage, idx) => {
          return (
            <motion.div
              key={stage.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: idx * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <TimelineNode
                label={stage.label}
                agent={stage.agent}
                desc={stage.desc}
                status={idx < 4 ? "completed" : "idle"}
                index={idx}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
