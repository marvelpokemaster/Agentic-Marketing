"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cpu, Search, Target, FileText, Image as ImageIcon, Sparkles } from "lucide-react";

interface LoadingStateProps {
  label?: string;
  stage?: string;
}

const STAGE_CONFIGS: Record<string, { icon: React.ReactNode; defaultMsg: string }> = {
  planning: {
    icon: <Sparkles className="h-6 w-6 text-primary animate-pulse" />,
    defaultMsg: "Planner Agent is evaluating product scope and search intent...",
  },
  researching: {
    icon: <Search className="h-6 w-6 text-primary animate-pulse" />,
    defaultMsg: "Research Agent is executing SerpAPI multi-query competitor discovery...",
  },
  analyzing: {
    icon: <Cpu className="h-6 w-6 text-primary animate-pulse" />,
    defaultMsg: "Analyst Agent is extracting benchmark metrics and search trends...",
  },
  strategizing: {
    icon: <Target className="h-6 w-6 text-primary animate-pulse" />,
    defaultMsg: "Strategy Agent is formulating GTM positioning & messaging pillars...",
  },
  generating_content: {
    icon: <FileText className="h-6 w-6 text-primary animate-pulse" />,
    defaultMsg: "Content Agent is drafting platform-tailored hooks and captions...",
  },
  generating_images: {
    icon: <ImageIcon className="h-6 w-6 text-primary animate-pulse" />,
    defaultMsg: "Creative Agent is rendering visual assets & marketing creatives...",
  },
};

export function LoadingState({ label, stage }: LoadingStateProps) {
  const stageInfo = stage ? STAGE_CONFIGS[stage] : null;
  const displayLabel = label || stageInfo?.defaultMsg || "Autonomous AI Agent Executing...";

  return (
    <div className="card py-12 px-6 flex flex-col items-center justify-center text-center relative overflow-hidden bg-panel/80">
      {/* Scanning laser beam effect */}
      <motion.div
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent"
      />

      <div className="relative flex items-center justify-center mb-5">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute h-16 w-16 rounded-full bg-primary/20"
        />
        <div className="p-3 rounded-full bg-primary/10 border border-primary/30 text-primary z-10">
          {stageInfo?.icon || <Cpu className="h-6 w-6 animate-pulse" />}
        </div>
      </div>

      <h4 className="font-heading text-base font-bold text-slate-100 mb-1.5">{displayLabel}</h4>
      {stage && (
        <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-2">
          {stage.replace(/_/g, " ")}
        </span>
      )}
      <p className="font-mono text-[11px] text-muted/60 tracking-wider">
        SYS_STATUS: AGENT_REASONING_ACTIVE
      </p>
    </div>
  );
}
