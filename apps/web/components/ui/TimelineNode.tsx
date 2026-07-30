"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, AlertCircle, Loader2 } from "lucide-react";

interface TimelineNodeProps {
  label: string;
  agent: string;
  desc: string;
  status: "idle" | "running" | "completed" | "failed";
  index: number;
}

export function TimelineNode({ label, agent, desc, status, index }: TimelineNodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative p-3.5 rounded-lg border transition-all duration-200 ${
        status === "running"
          ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/10"
          : status === "completed"
          ? "bg-surface/60 border-emerald-500/20 text-slate-200"
          : status === "failed"
          ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
          : "bg-surface/30 border-border/40 text-muted/60 opacity-70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {status === "running" ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          ) : status === "completed" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : status === "failed" ? (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : (
            <Circle className="h-4 w-4 text-slate-600 shrink-0" />
          )}
          <div>
            <span className="font-heading text-xs font-bold block text-slate-100">{label}</span>
            <span className="font-mono text-[10px] text-muted/80 block">{agent}</span>
          </div>
        </div>
      </div>
      <p className="mt-1.5 font-sans text-[11px] text-muted/70 leading-snug">{desc}</p>
    </motion.div>
  );
}
