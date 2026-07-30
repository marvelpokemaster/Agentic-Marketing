"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends HTMLMotionProps<"div"> {
  interactive?: boolean;
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Card({
  interactive = false,
  glow = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={
        interactive
          ? {
              y: -2,
              borderColor: "rgba(0, 102, 255, 0.4)",
              transition: { duration: 0.2 },
            }
          : undefined
      }
      className={cn(
        "relative rounded-xl border border-border bg-panel/90 p-6 backdrop-blur-md transition-colors duration-200",
        interactive && "cursor-pointer hover:shadow-2xl hover:shadow-primary/10",
        glow && "before:absolute before:inset-0 before:rounded-xl before:p-[1px] before:bg-gradient-to-br before:from-primary/20 before:to-transparent before:pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
