"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "./Card";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: string;
  badge?: React.ReactNode;
}

export function MetricCard({ label, value, subtext, icon, trend, badge }: MetricCardProps) {
  return (
    <Card className="flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-muted">
          {label}
        </span>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <motion.h4
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="font-heading text-2xl font-bold text-foreground"
          >
            {value}
          </motion.h4>
          {badge}
        </div>
        {(subtext || trend) && (
          <p className="mt-1 font-sans text-xs text-muted flex items-center gap-1.5">
            {trend && <span className="text-emerald-500 font-mono font-medium">{trend}</span>}
            {subtext}
          </p>
        )}
      </div>
    </Card>
  );
}
