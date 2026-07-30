"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function AnimatedButton({
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: AnimatedButtonProps) {
  const variantStyles = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 border border-primary/40",
    ghost: "bg-surface/50 text-slate-200 hover:bg-primary/10 hover:border-primary/40 border border-border",
    outline: "bg-transparent text-slate-300 hover:border-primary/40 hover:bg-primary/5 border border-border",
    danger: "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30",
  };

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-5 py-2.5 text-sm rounded-lg gap-2",
    lg: "px-7 py-3 text-base rounded-xl gap-2.5 font-bold",
  };

  return (
    <motion.button
      whileHover={disabled || isLoading ? undefined : { scale: 1.015, y: -1 }}
      whileTap={disabled || isLoading ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
          <span>Executing...</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </motion.button>
  );
}
