"use client";

import React from "react";
import { CheckCircle2, Circle, AlertCircle, Loader2 } from "lucide-react";

interface TimelineNodeProps {
  label: string;
  agent: string;
  desc: string;
  status: "idle" | "running" | "completed" | "failed";
  index: number;
}

export function TimelineNode({ label, agent, desc, status }: TimelineNodeProps) {
  const border =
    status === "running"
      ? "border-primary"
      : status === "failed"
      ? "border-danger"
      : "border-border";

  return (
    <div className={`rounded-[10px] border bg-panel p-4 ${border}`}>
      <div className="flex items-start gap-2.5">
        {status === "running" ? (
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
        ) : status === "completed" ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        ) : status === "failed" ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
        ) : (
          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-border" />
        )}
        <div className="min-w-0">
          <span
            className={`block font-heading text-sm font-semibold ${
              status === "idle" ? "text-muted" : "text-foreground"
            }`}
          >
            {label}
          </span>
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-muted">
            {agent}
          </span>
        </div>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-muted">{desc}</p>
    </div>
  );
}
