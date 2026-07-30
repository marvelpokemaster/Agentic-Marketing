"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function GlassPanel({ children, className = "", ...props }: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-panel rounded-2xl p-6 relative overflow-hidden ${className}`}
      {...props}
    >
      <div className="absolute top-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      {children}
    </motion.div>
  );
}
