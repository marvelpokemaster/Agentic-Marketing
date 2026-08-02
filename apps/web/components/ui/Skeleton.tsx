"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
  level?: 2 | 3;
}

export function Skeleton({ className = "", shimmer = false, level = 2 }: SkeletonProps) {
  const levelClass = level === 3 ? "glass-elevated" : "skeleton-glass";

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${levelClass} ${
        shimmer ? "" : "animate-pulse"
      } ${className}`}
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
    </div>
  );
}
