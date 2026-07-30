"use client";

import React from "react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card py-16 px-6 flex flex-col items-center justify-center text-center border-dashed border-border bg-surface/30"
    >
      {icon && (
        <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 mb-4">
          {icon}
        </div>
      )}
      <h4 className="font-heading text-lg font-bold text-foreground mb-1">{title}</h4>
      <p className="font-sans text-xs text-muted max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action}
    </motion.div>
  );
}
