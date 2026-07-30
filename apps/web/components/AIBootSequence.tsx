"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu } from "lucide-react";
import { playUISound } from "@/lib/audio";

const BOOT_STEPS = [
  "Initializing Mission Control System...",
  "Connecting Neural Agent Network...",
  "Planner Agent Online",
  "Research Agent Online",
  "Strategy Agent Online",
  "Creative Agent Online",
  "Autonomous AI Operating System Ready",
];

export function AIBootSequence() {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasBooted = sessionStorage.getItem("has_booted");
    if (!hasBooted) {
      setVisible(true);
      playUISound("agent_start");
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (stepIndex < BOOT_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setStepIndex((prev) => prev + 1);
        playUISound("hover");
      }, 350);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [visible, stepIndex]);

  const handleDismiss = () => {
    sessionStorage.setItem("has_booted", "true");
    setVisible(false);
    playUISound("complete");
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg p-6 text-center"
      >
        <div className="space-y-6 max-w-md w-full">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 text-primary shadow-2xl">
            <Cpu className="h-8 w-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="font-heading text-xl font-bold text-foreground">
              Agentic Marketing OS
            </h2>
            <p className="font-mono text-xs text-primary uppercase tracking-widest h-6">
              {BOOT_STEPS[stepIndex]}
            </p>
          </div>

          <div className="w-full bg-surface/80 rounded-full h-1.5 border border-border/40 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${((stepIndex + 1) / BOOT_STEPS.length) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>

          <button
            onClick={handleDismiss}
            className="font-mono text-[11px] text-muted hover:text-foreground transition underline"
          >
            Skip Initialization
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
