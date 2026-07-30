"use client";

import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, badge, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border/40 pb-4 mb-6">
      <div className="space-y-1">
        {badge && (
          <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {badge}
          </div>
        )}
        <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="font-sans text-xs text-muted leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
