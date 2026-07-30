"use client";

import React from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { playUISound } from "@/lib/audio";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    playUISound("click");
    toggleTheme();
  };

  return (
    <motion.button
      onClick={handleToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="p-2 rounded-xl bg-surface/60 border border-border/60 text-slate-300 hover:text-primary transition duration-200 shadow-lg backdrop-blur-md flex items-center gap-2 font-mono text-xs font-semibold"
      title={`Switch to ${theme === "command-center" ? "AI Laboratory" : "AI Command Center"} Theme`}
      data-magnetic="true"
    >
      {theme === "command-center" ? (
        <>
          <Moon className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Command Center</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 text-amber-400" />
          <span className="hidden sm:inline">AI Laboratory</span>
        </>
      )}
    </motion.button>
  );
}
