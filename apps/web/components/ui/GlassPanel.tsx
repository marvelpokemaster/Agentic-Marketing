"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Flat bordered panel. Name retained so existing call sites keep working.
 */
export function GlassPanel({ children, className = "", ...props }: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`panel p-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
