"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  level?: 2 | 3;
}

/**
 * Premium glass-elevated panel with luminous border and backdrop blur.
 * level: 2 = standard panel, 3 = elevated modal/dropdown
 */
export function GlassPanel({ children, className = "", level = 2, ...props }: GlassPanelProps) {
  const levelClass = level === 3 ? "glass-elevated" : "glass-panel";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`${levelClass} glass-glow p-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
