"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";

interface LoadingStateProps {
  label?: string;
  stage?: string;
}

export function LoadingState({ label = "Autonomous AI Agent Executing...", stage }: LoadingStateProps) {
  return (
    <div className="card py-12 px-6 flex flex-col items-center justify-center text-center relative overflow-hidden bg-panel/80">
      {/* Scanning laser beam effect */}
      <motion.div
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent"
      />

      <div className="relative flex items-center justify-center mb-5">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute h-16 w-16 rounded-full bg-primary/20"
        />
        <div className="p-3 rounded-full bg-primary/10 border border-primary/30 text-primary z-10">
          <Cpu className="h-6 w-6 animate-pulse" />
        </div>
      </div>

      <h4 className="font-heading text-base font-bold text-slate-100 mb-1">{label}</h4>
      {stage && (
        <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-2">
          {stage}
        </span>
      )}
      <p className="font-mono text-[11px] text-muted/60 tracking-wider">
        SYS_STATUS: AGENT_REASONING_ACTIVE
      </p>
    </div>
  );
}
