"use client";

import React from "react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface TimelineNodeProps {
  label: string;
  agent: string;
  desc: string;
  status: "idle" | "running" | "completed" | "failed";
  index: number;
}

export function TimelineNode({ label, agent, desc, status }: TimelineNodeProps) {
  const borderStyle =
    status === "running"
      ? "border-primary/30 shadow-glow"
      : status === "failed"
      ? "border-danger/30 shadow-[0_0_16px_rgba(239,68,68,0.15)]"
      : status === "completed"
      ? "border-success/20"
      : "border-border";

  const bgStyle =
    status === "running"
      ? "bg-primary/5"
      : status === "failed"
      ? "bg-danger/5"
      : status === "completed"
      ? "bg-success/3"
      : "bg-glass-bg";

  return (
    <div className={`rounded-2xl border backdrop-blur-md p-4 transition-all duration-300 ${borderStyle} ${bgStyle}`}>
      <div className="flex items-start gap-2.5">
        {status === "running" ? (
          <span className="mt-0.5 spinner-gradient shrink-0" />
        ) : status === "completed" ? (
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-success"
            style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.5))" }}
          />
        ) : status === "failed" ? (
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-danger"
            style={{ filter: "drop-shadow(0 0 4px rgba(239,68,68,0.5))" }}
          />
        ) : (
          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted/40" />
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
