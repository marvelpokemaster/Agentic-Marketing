"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "command-center" | "laboratory";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>("command-center");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("theme_mode") as ThemeMode | null;
    if (saved === "command-center" || saved === "laboratory") {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      const initial = prefersLight ? "laboratory" : "command-center";
      setTheme(initial);
      document.documentElement.setAttribute("data-theme", initial);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "command-center" ? "laboratory" : "command-center";
    setTheme(nextTheme);
    localStorage.setItem("theme_mode", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  return { theme, toggleTheme };
}
