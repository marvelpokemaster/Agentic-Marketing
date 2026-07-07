import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#09090B",
        panel: "#18181B",
        surface: "#111318",
        border: "rgba(99, 102, 241, 0.12)",
        muted: "#a1a1aa",
        primary: "#6366F1",
        accent: "#00d2ff",
        danger: "#f43f5e",
      },
      borderRadius: {
        xl: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
