"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, ChevronDown, Check } from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { playUISound } from "@/lib/audio";

export function ThemeToggle() {
  const { theme, themeConfig, setTheme, THEMES } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTheme = (mode: ThemeMode) => {
    playUISound("click");
    setTheme(mode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        onClick={() => {
          playUISound("hover");
          setIsOpen(!isOpen);
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="px-3 py-1.5 rounded-xl bg-surface/80 border border-border/80 text-foreground transition duration-200 shadow-md backdrop-blur-md flex items-center gap-2 font-mono text-xs font-semibold"
        title="Switch Visual Identity Theme"
      >
        <span
          className="h-2.5 w-2.5 rounded-full shadow-sm"
          style={{ backgroundColor: themeConfig.primaryHex }}
        />
        <span className="hidden sm:inline font-heading text-xs font-bold text-slate-100">
          {themeConfig.name}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-panel border border-border/80 rounded-xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-2xl"
          >
            <div className="px-3 py-1.5 border-b border-border/40 mb-1 flex items-center gap-2 text-muted">
              <Palette className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Visual Themes</span>
            </div>

            {THEMES.map((t) => {
              const isSelected = theme === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  className={`w-full text-left p-2.5 rounded-lg font-sans transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-primary/10 border border-primary/30 text-slate-100"
                      : "hover:bg-surface/80 text-muted hover:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-md"
                      style={{ backgroundColor: t.primaryHex }}
                    />
                    <div className="min-w-0">
                      <span className="font-heading text-xs font-bold block truncate text-slate-100">
                        {t.name}
                      </span>
                      <span className="font-mono text-[10px] text-muted/70 block truncate">
                        {t.tagline}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
