"use client";

import React from "react";
import { Cpu, Search, Target, FileText, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
  stage?: string;
}

const STAGE_CONFIGS: Record<string, { icon: React.ReactNode; defaultMsg: string }> = {
  planning: {
    icon: <Sparkles className="h-5 w-5" />,
    defaultMsg: "Planner agent is evaluating product scope and search intent",
  },
  researching: {
    icon: <Search className="h-5 w-5" />,
    defaultMsg: "Research agent is running SerpAPI competitor discovery",
  },
  analyzing: {
    icon: <Cpu className="h-5 w-5" />,
    defaultMsg: "Analyst agent is extracting benchmarks and search trends",
  },
  strategizing: {
    icon: <Target className="h-5 w-5" />,
    defaultMsg: "Strategy agent is forming positioning and messaging pillars",
  },
  generating_content: {
    icon: <FileText className="h-5 w-5" />,
    defaultMsg: "Content agent is drafting platform-tailored hooks and captions",
  },
  generating_images: {
    icon: <ImageIcon className="h-5 w-5" />,
    defaultMsg: "Creative agent is rendering visual assets",
  },
};

export function LoadingState({ label, stage }: LoadingStateProps) {
  const stageInfo = stage ? STAGE_CONFIGS[stage] : null;
  const displayLabel = label || stageInfo?.defaultMsg || "Agent running";

  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] border border-border bg-panel px-6 py-16 text-center">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-primary">
        {stageInfo?.icon || <Loader2 className="h-5 w-5 animate-spin" />}
      </div>

      <h3 className="font-heading text-base font-semibold text-foreground">{displayLabel}</h3>

      {stage && (
        <span className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted">
          <Loader2 className="h-3 w-3 animate-spin" />
          {stage.replace(/_/g, " ")}
        </span>
      )}
    </div>
  );
}
