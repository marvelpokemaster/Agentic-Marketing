"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

export function Skeleton({ className = "", shimmer = false }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-surface/60 ${
        shimmer ? "" : "animate-pulse"
      } ${className}`}
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
    </div>
  );
}
