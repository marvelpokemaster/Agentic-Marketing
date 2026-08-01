import React from "react";

export interface Stat {
  value: string;
  label: string;
  detail?: string;
}

interface StatRowProps {
  stats: Stat[];
  className?: string;
}

/**
 * Hairline-divided band of oversized figures — the reference design's
 * "100% / 6+ / Any / 0" row.
 */
export function StatRow({ stats, className = "" }: StatRowProps) {
  return (
    <div className={`grid grid-cols-2 gap-px bg-border md:grid-cols-4 ${className}`}>
      {stats.map((s) => (
        <div key={s.label} className="bg-bg px-5 py-7">
          <div className="font-heading text-4xl font-semibold tracking-tight text-foreground">
            {s.value}
          </div>
          <div className="eyebrow mt-3">{s.label}</div>
          {s.detail && (
            <p className="mt-2 text-xs leading-relaxed text-muted">{s.detail}</p>
          )}
        </div>
      ))}
    </div>
  );
}
