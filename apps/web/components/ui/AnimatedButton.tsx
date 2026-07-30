"use client";

import React from "react";
import { motion } from "framer-motion";
import { playUISound } from "@/lib/audio";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  icon?: React.ReactNode;
}

export function AnimatedButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className = "",
  type = "button",
  icon,
}: AnimatedButtonProps) {
  const baseClasses =
    variant === "primary"
      ? "btn"
      : variant === "ghost"
      ? "btn-ghost"
      : variant === "outline"
      ? "btn-outline"
      : "inline-flex items-center justify-center gap-2 rounded-lg bg-rose-500/20 border border-rose-500/30 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 transition duration-200";

  const sizeClasses =
    size === "sm" ? "px-3 py-1.5 text-xs" : size === "lg" ? "px-6 py-3 text-base" : "";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playUISound(variant === "primary" ? "agent_start" : "click");
    if (onClick) onClick();
  };

  const handleMouseEnter = () => {
    playUISound("hover");
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled || isLoading}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02, y: disabled || isLoading ? 0 : -1 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      data-magnetic="true"
      className={`${baseClasses} ${sizeClasses} ${className} relative overflow-hidden`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {icon}
          <span>{children}</span>
        </span>
      )}
    </motion.button>
  );
}
