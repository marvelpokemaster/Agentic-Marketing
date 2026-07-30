"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Globe, Target } from "lucide-react";
import type { CompetitorResult } from "@/lib/types";

interface NetworkGraphProps {
  queries?: string[];
  competitors?: CompetitorResult[];
}

export function NetworkGraph({ queries = [], competitors = [] }: NetworkGraphProps) {
  if (queries.length === 0 && competitors.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-surface/40 p-6 backdrop-blur-md">
      {/* Background Neural Grid */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-around gap-8 py-4">
        {/* Central Core Node */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 20px rgba(0,102,255,0.3)", "0 0 40px rgba(0,102,255,0.6)", "0 0 20px rgba(0,102,255,0.3)"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-primary shadow-2xl"
        >
          <Target className="h-8 w-8 animate-pulse" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider mt-1">GTM Core</span>
        </motion.div>

        {/* Query Cluster */}
        {queries.length > 0 && (
          <div className="space-y-2 flex-1">
            <span className="font-mono text-[10px] font-bold text-primary uppercase tracking-widest block mb-2">
              Inferred Search Vector Network
            </span>
            <div className="flex flex-wrap gap-2">
              {queries.map((q, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={{ scale: 1.05 }}
                  className="font-mono text-xs px-3 py-1.5 rounded-lg bg-surface/80 border border-primary/30 text-slate-200 flex items-center gap-1.5 shadow-lg"
                >
                  <Search className="h-3 w-3 text-primary shrink-0" />
                  <span>&quot;{q}&quot;</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Competitor Nodes */}
        {competitors.length > 0 && (
          <div className="space-y-2 flex-1">
            <span className="font-mono text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">
              Competitor Benchmark Targets
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {competitors.slice(0, 4).map((c, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.08 }}
                  whileHover={{ scale: 1.03 }}
                  className="font-sans text-xs p-2.5 rounded-lg bg-surface/80 border border-secondary/30 text-slate-200 flex items-center gap-2 shadow-lg"
                >
                  <Globe className="h-3.5 w-3.5 text-secondary shrink-0" />
                  <span className="truncate font-semibold">{c.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
