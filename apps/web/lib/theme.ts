"use client";

import { useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark";

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  tagline: string;
  primaryHex: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: "light",
    name: "Paper",
    tagline: "Warm cream, ink black",
    primaryHex: "#b8502f",
  },
  {
    id: "dark",
    name: "Ink",
    tagline: "Warm near-black, ember accent",
    primaryHex: "#e0794f",
  },
];

const THEME_CHANGE_EVENT = "agentic_theme_changed";
const STORAGE_KEY = "theme_mode";

export function getThemeConfig(id: ThemeMode): ThemeConfig {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

/**
 * Maps any previously stored value — including the retired five-theme ids
 * (command-center, laboratory, nebula, solar, void) — onto the light/dark pair,
 * so returning users never land on a `data-theme` with no CSS block.
 */
function normalizeStoredTheme(value: string | null): ThemeMode | null {
  if (!value) return null;
  if (value === "light" || value === "laboratory") return "light";
  return "dark";
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  const applyTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Suppress transitions while the tokens swap — see the `.theme-switching`
    // note in globals.css. Reading offsetHeight forces the style recalc to
    // commit synchronously, so the class is never left behind (a rAF callback
    // would not fire in a backgrounded tab).
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", mode);
    void root.offsetHeight;
    root.classList.remove("theme-switching");

    localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: mode }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = normalizeStoredTheme(localStorage.getItem(STORAGE_KEY));
    if (stored) {
      applyTheme(stored);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }

    const handleCustomChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "light" || detail === "dark") {
        setThemeState(detail);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleCustomChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleCustomChange);
  }, [applyTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    applyTheme(theme === "light" ? "dark" : "light");
  };

  const themeConfig = getThemeConfig(theme);

  return { theme, themeConfig, setTheme, toggleTheme, THEMES };
}
