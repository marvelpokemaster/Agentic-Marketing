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

  const dotBg = isSuccess
    ? "bg-success"
    : isRunning
    ? "bg-primary"
    : isFailed
    ? "bg-danger"
    : isWarning
    ? "bg-warning"
    : "bg-muted";

  const glowShadow = isSuccess
    ? "shadow-[0_0_8px_rgba(16,185,129,0.4)]"
    : isRunning
    ? "shadow-[0_0_8px_var(--glow-color)]"
    : isFailed
    ? "shadow-[0_0_8px_rgba(239,68,68,0.4)]"
    : "";

  const borderTint = isSuccess
    ? "border-success/20 bg-success/5"
    : isRunning
    ? "border-primary/20 glass-active"
    : isFailed
    ? "border-danger/20 bg-danger/5"
    : isWarning
    ? "border-warning/20 bg-warning/5"
    : "border-border bg-surface";

  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-mono font-medium uppercase tracking-wider ${sizeClasses} ${tone} ${borderTint} border backdrop-blur-sm`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {(pulse || isRunning) && (
          <span className={`absolute inset-0 rounded-full ${dotBg} animate-ping opacity-60`} />
        )}
        <span className={`relative h-1.5 w-1.5 rounded-full ${dotBg} ${glowShadow}`} />
      </span>
      {status.replace(/_/g, " ")}
    </span>
  );
}
