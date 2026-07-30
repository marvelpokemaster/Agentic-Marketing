"use client";

import React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", interactive = false, onClick }: CardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-60, 60], [4, -4]);
  const rotateY = useTransform(x, [-60, 60], [-4, 4]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        rotateX: interactive ? rotateX : 0,
        rotateY: interactive ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      data-magnetic={interactive ? "true" : undefined}
      className={`card relative overflow-hidden ${interactive ? "card-interactive" : ""} ${className}`}
    >
      {/* Subtle light sweep border glow */}
      {interactive && (
        <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 transition duration-300 hover:opacity-100" />
      )}
      {children}
    </motion.div>
  );
}
