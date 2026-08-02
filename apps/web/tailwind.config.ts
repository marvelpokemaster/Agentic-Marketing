import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        bg: "var(--bg-color)",
        panel: "var(--panel-bg)",
        surface: "var(--surface-bg)",
        border: "var(--border-color)",
        "border-hover": "var(--border-hover)",
        foreground: "var(--text-primary)",
        muted: "var(--text-muted)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        secondary: "var(--color-secondary)",
        danger: "var(--color-danger)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        ink: "var(--ink-bg)",
        "ink-panel": "var(--ink-panel)",
        "ink-border": "var(--ink-border)",
        "ink-text": "var(--ink-text)",
        "ink-muted": "var(--ink-muted)",
      },
      borderRadius: {
        xl: "10px",
        "2xl": "14px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spin-slow": "spin 20s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "glass-shimmer": "shimmer 8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.3", transform: "rotate(0deg)" },
          "50%": { opacity: "0.6", transform: "rotate(180deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
