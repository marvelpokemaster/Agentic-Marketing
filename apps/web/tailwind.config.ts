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
        bg: "#0b0f10",
        panel: "#11181b",
        surface: "#16211f",
        border: "#1f2c2a",
        muted: "#8aa39c",
        primary: "#4edea3",
        accent: "#6ea8fe",
        danger: "#ff6b6b",
      },
      borderRadius: {
        xl: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
