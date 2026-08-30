import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F6F3",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#141414",
          soft: "#2A2A28",
          muted: "#6B6B66",
        },
        accent: {
          DEFAULT: "#1E7A4C",
          light: "#2E9C63",
          dark: "#145A38",
          soft: "#E4F1E9",
        },
        sand: {
          DEFAULT: "#EFEAE1",
          dark: "#DCD4C4",
        },
        line: "#E7E4DC",
        warn: "#C7862B",
        danger: "#B84040",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20,20,20,0.04), 0 8px 24px rgba(20,20,20,0.04)",
        card: "0 1px 3px rgba(20,20,20,0.05), 0 12px 32px -8px rgba(20,20,20,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
