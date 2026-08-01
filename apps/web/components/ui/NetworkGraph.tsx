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
    <div className="grid gap-8 rounded-[10px] border border-border bg-panel p-6 md:grid-cols-2">
      {queries.length > 0 && (
        <div>
          <span className="eyebrow">Search queries issued</span>
          <ul className="mt-4 space-y-px">
            {queries.map((q, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2.5 border-t border-border py-2.5 font-mono text-xs text-foreground first:border-t-0"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
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
                className="flex items-center gap-2.5 border-t border-border py-2.5 text-xs text-foreground first:border-t-0"
              >
                <Globe className="h-3.5 w-3.5 shrink-0 text-muted" />
                <span className="truncate font-medium">{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
