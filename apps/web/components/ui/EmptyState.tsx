"use client";

import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-glass-2-border glass-panel px-8 py-24 text-center backdrop-blur-md overflow-hidden">
      {/* Subtle aurora background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, var(--glow-color) 0%, transparent 60%)",
        }}
      />

      {icon && (
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-primary animate-float">
          {/* Glow halo */}
          <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" />
          <div className="relative">{icon}</div>
        </div>
      )}
      <h3 className="relative font-heading text-lg font-semibold text-foreground">{title}</h3>
      <p className="relative mt-3 mb-8 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      {action && <div className="relative">{action}</div>}
    </div>
  );
}
