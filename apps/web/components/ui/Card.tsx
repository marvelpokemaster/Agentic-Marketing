"use client";

import React from "react";
import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  level?: 2 | 3;
}

export function Card({ children, className = "", interactive = false, onClick, level = 2 }: CardProps) {
  const levelClass = level === 3 ? "glass-elevated" : "card";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={`${levelClass} ${interactive ? "card-interactive" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}
