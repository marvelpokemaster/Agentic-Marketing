"use client";

import React from "react";
import { StageRail } from "./StageRail";

interface LoadingStateProps {
  label?: string;
  stage?: string;
  isExecuting?: boolean;
}

export function LoadingState({ label, stage = "planning", isExecuting = true }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-glass-border bg-glass-bg p-8 shadow-glass backdrop-blur-md text-center space-y-6">
      <div className="space-y-1">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {label || "Autonomous Campaign Execution in Progress"}
        </h3>
        <p className="text-xs text-muted">
          Multi-agent system is running state transition pipeline across active channels
        </p>
      </div>

      <StageRail currentStage={stage} isExecuting={isExecuting} />
    </div>
  );
}
