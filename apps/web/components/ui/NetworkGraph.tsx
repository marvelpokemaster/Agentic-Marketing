"use client";

import React from "react";
import { Search, Globe } from "lucide-react";
import type { CompetitorResult } from "@/lib/types";

interface NetworkGraphProps {
  queries?: string[];
  competitors?: CompetitorResult[];
}

export function NetworkGraph({ queries = [], competitors = [] }: NetworkGraphProps) {
  if (queries.length === 0 && competitors.length === 0) return null;

  return (
    <div className="grid gap-6 rounded-2xl border border-border bg-glass-bg p-6 backdrop-blur-md md:grid-cols-2">
      {queries.length > 0 && (
        <div>
          <span className="eyebrow">Search queries issued</span>
          <ul className="mt-4 space-y-px">
            {queries.map((q, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 border-t border-border py-3 font-mono text-xs text-foreground first:border-t-0 transition-colors hover:bg-surface/50 rounded-lg px-2 -mx-2"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Search className="h-3 w-3" />
                </span>
                <span className="truncate">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {competitors.length > 0 && (
        <div>
          <span className="eyebrow">Competitors identified</span>
          <ul className="mt-4 space-y-px">
            {competitors.slice(0, 6).map((c, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 border-t border-border py-3 text-xs text-foreground first:border-t-0 transition-colors hover:bg-surface/50 rounded-lg px-2 -mx-2"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <Globe className="h-3 w-3" />
                </span>
                <span className="truncate font-medium">{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
