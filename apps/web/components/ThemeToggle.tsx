"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { playUISound } from "@/lib/audio";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => {
        playUISound("click");
        toggleTheme();
      }}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-panel text-muted transition-colors hover:border-border-hover hover:text-foreground"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
