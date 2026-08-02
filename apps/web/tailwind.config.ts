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
        "bg-deeper": "var(--bg-deeper)",
        panel: "var(--panel-bg)",
        surface: "var(--surface-bg)",
        border: "var(--border-color)",
        "border-hover": "var(--border-hover)",
        foreground: "var(--text-primary)",
        muted: "var(--text-muted)",
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
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
        "glass-bg": "var(--glass-bg)",
        "glass-border": "var(--glass-border)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        glass: "var(--glass-shadow)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spin-slow": "spin 20s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "glass-shimmer": "shimmer 8s ease-in-out infinite",
        "glow-pulse": "glowPulse 2.5s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "gradient-shift": "gradientShift 6s ease-in-out infinite",
        "border-glow": "borderGlow 3s ease-in-out infinite",
        "aurora-drift": "auroraDrift 15s ease-in-out infinite alternate",
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
        glowPulse: {
          "0%, 100%": { opacity: "0.4", boxShadow: "0 0 8px var(--glow-color)" },
          "50%": { opacity: "1", boxShadow: "0 0 24px var(--glow-color), 0 0 48px var(--glow-accent)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        gradientShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        borderGlow: {
          "0%, 100%": { borderColor: "rgba(139, 92, 246, 0.2)" },
          "50%": { borderColor: "rgba(34, 211, 238, 0.3)" },
        },
        auroraDrift: {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "100%": { transform: "rotate(3deg) scale(1.05)" },
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
