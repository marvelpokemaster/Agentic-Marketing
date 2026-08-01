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
  const isRunning = ["running", "researching", "publishing", "executing", "generating", "preparing", "generating_content", "generating_images"].includes(normalized);
  const isFailed = ["failed", "error", "offline"].includes(normalized);
  const isWarning = ["draft", "partially_published", "scheduled"].includes(normalized);

  const tone = isSuccess
    ? "text-success"
    : isRunning
    ? "text-primary"
    : isFailed
    ? "text-danger"
    : isWarning
    ? "text-warning"
    : "text-muted";

  const dot = isSuccess
    ? "bg-success"
    : isRunning
    ? "bg-primary"
    : isFailed
    ? "bg-danger"
    : isWarning
    ? "bg-warning"
    : "bg-muted";

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-surface font-mono font-medium uppercase tracking-wider ${sizeClasses} ${tone}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dot} ${pulse || isRunning ? "animate-pulse" : ""}`}
      />
      {status.replace(/_/g, " ")}
    </span>
  );
}
