"use client";

import React from "react";
import { motion } from "framer-motion";

interface AICoreProps {
  size?: "hero" | "pipeline" | "cta";
  velocity?: number;
}

export function AICore({ size = "hero", velocity = 0 }: AICoreProps) {
  const sizeMap = {
    hero: "w-72 h-72 sm:w-96 sm:h-96 md:w-[480px] md:h-[480px]",
    pipeline: "w-56 h-56 sm:w-72 sm:h-72",
    cta: "w-40 h-40 sm:w-52 sm:h-52",
  };

  const speedMultiplier = 1 + Math.min(3, velocity * 0.05);

  return (
    <div
      className={`relative flex items-center justify-center pointer-events-none select-none ${sizeMap[size]}`}
      aria-hidden="true"
    >
      {/* Outer Glow Halo */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 via-accent/15 to-secondary/10 blur-3xl animate-pulse-glow" />

      {/* Ring 1 — Outer Track */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 35 / speedMultiplier,
          ease: "linear",
        }}
        className="absolute inset-2 rounded-full border border-primary/25 border-dashed"
      >
        <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-lg shadow-primary/50" />
        <div className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent shadow-md" />
      </motion.div>

      {/* Ring 2 — Counter Rotation Track */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          repeat: Infinity,
          duration: 22 / speedMultiplier,
          ease: "linear",
        }}
        className="absolute inset-10 rounded-full border border-accent/20"
      >
        <div className="absolute top-1/2 -left-1.5 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-primary" />
        <div className="absolute top-1/2 -right-1.5 h-3 w-3 -translate-y-1/2 rounded-full bg-secondary shadow-lg shadow-secondary/50" />
      </motion.div>

      {/* Ring 3 — Inner High-Velocity Core */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 14 / speedMultiplier,
          ease: "linear",
        }}
        className="absolute inset-20 rounded-full border border-primary/30 border-dashed"
      >
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
      </motion.div>

      {/* Central Illuminated Node */}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-panel/80 backdrop-blur-md shadow-2xl shadow-primary/30 sm:h-20 sm:w-20">
        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-primary via-accent to-secondary animate-ping opacity-75" />
        <div className="absolute h-5 w-5 rounded-full bg-primary shadow-lg shadow-primary/60" />
      </div>
    </div>
  );
}
