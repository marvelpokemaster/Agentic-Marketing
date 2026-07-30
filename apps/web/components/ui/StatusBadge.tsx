"use client";

import React from "react";

interface StatusBadgeProps {
  status: string;
  pulse?: boolean;
  size?: "sm" | "md";
}

export function StatusBadge({ status, pulse = false, size = "md" }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const isSuccess = ["published", "ready", "completed", "configured", "connected"].includes(normalized);
  const isRunning = ["running", "researching", "publishing", "executing", "generating_content", "generating_images"].includes(normalized);
  const isFailed = ["failed", "error", "offline"].includes(normalized);
  const isWarning = ["draft", "partially_published", "scheduled"].includes(normalized);

  const style = isSuccess
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : isRunning
    ? "bg-primary/10 text-primary border-primary/30"
    : isFailed
    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
    : isWarning
    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
    : "bg-slate-800/50 text-slate-400 border-slate-700/30";

  const dotStyle = isSuccess
    ? "bg-emerald-400"
    : isRunning
    ? "bg-primary"
    : isFailed
    ? "bg-rose-400"
    : isWarning
    ? "bg-amber-400"
    : "bg-slate-400";

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-mono font-semibold uppercase tracking-wider ${sizeClasses} ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyle} ${(pulse || isRunning) ? "animate-pulse" : ""}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}
