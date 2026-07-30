"use client";

import { useEffect, useState, useCallback } from "react";

export type ThemeMode = "command-center" | "laboratory" | "nebula" | "solar" | "void";

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  tagline: string;
  primaryHex: string;
  particleHex: string;
  coreHex: string;
  bgHex: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: "command-center",
    name: "Command Center",
    tagline: "Deep navy, electric blue & glass vector core",
    primaryHex: "#0066ff",
    particleHex: "#0066ff",
    coreHex: "#38bdf8",
    bgHex: "#050508",
  },
  {
    id: "laboratory",
    name: "AI Laboratory",
    tagline: "Apple-inspired silver, bright white & clean precision",
    primaryHex: "#0284c7",
    particleHex: "#0284c7",
    coreHex: "#6366f1",
    bgHex: "#f8fafc",
  },
  {
    id: "nebula",
    name: "Nebula Cyberpunk",
    tagline: "Deep violet, neon magenta & glowing cyan lattice",
    primaryHex: "#d946ef",
    particleHex: "#d946ef",
    coreHex: "#06b6d4",
    bgHex: "#090514",
  },
  {
    id: "solar",
    name: "Solar Gold",
    tagline: "Warm amber gold, fiery orange & luxury finish",
    primaryHex: "#f59e0b",
    particleHex: "#f59e0b",
    coreHex: "#ea580c",
    bgHex: "#0d0905",
  },
  {
    id: "void",
    name: "OLED Void",
    tagline: "Absolute OLED black, graphite & high-contrast white",
    primaryHex: "#e5e5e5",
    particleHex: "#ffffff",
    coreHex: "#a3a3a3",
    bgHex: "#000000",
  },
];

const THEME_CHANGE_EVENT = "agentic_theme_changed";

export function getThemeConfig(id: ThemeMode): ThemeConfig {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("command-center");

  const applyTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", mode);
      localStorage.setItem("theme_mode", mode);
      window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: mode }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("theme_mode") as ThemeMode | null;
    const validThemes: ThemeMode[] = ["command-center", "laboratory", "nebula", "solar", "void"];
    if (saved && validThemes.includes(saved)) {
      applyTheme(saved);
    } else {
      const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      applyTheme(prefersLight ? "laboratory" : "command-center");
    }

    const handleCustomChange = (e: any) => {
      if (e.detail && validThemes.includes(e.detail)) {
        setThemeState(e.detail);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleCustomChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleCustomChange);
  }, [applyTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    applyTheme(newTheme);
  };

  const themeConfig = getThemeConfig(theme);

  return { theme, themeConfig, setTheme, THEMES };
}
