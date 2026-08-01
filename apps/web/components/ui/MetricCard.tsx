"use client";

import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: string;
  badge?: React.ReactNode;
}

export function MetricCard({ label, value, subtext, icon, trend, badge }: MetricCardProps) {
  return (
    <div className="card flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </span>
          {badge}
        </div>
        {(subtext || trend) && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            {trend && <span className="font-mono font-medium text-success">{trend}</span>}
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
