"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { playUISound } from "@/lib/audio";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
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
  loadingText,
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
      : "inline-flex items-center justify-center gap-2 rounded-lg border border-danger bg-transparent px-4 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger hover:text-panel disabled:opacity-50";

  const sizeClasses =
    size === "sm" ? "px-3 py-1.5 text-xs" : size === "lg" ? "px-6 py-3 text-base" : "";

  const handleClick = () => {
    playUISound(variant === "primary" ? "agent_start" : "click");
    if (onClick) onClick();
  };

  const handleMouseEnter = () => {
    playUISound("hover");
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
