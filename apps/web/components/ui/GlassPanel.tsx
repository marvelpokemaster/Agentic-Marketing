"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Premium glass-elevated panel with luminous border and backdrop blur.
 */
export function GlassPanel({ children, className = "", ...props }: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`panel glass-glow p-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
