import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0a0b",
          900: "#101012",
          850: "#161619",
          800: "#1c1c20",
          700: "#26262b",
          600: "#3a3a41",
          500: "#5a5a63",
          400: "#8a8a94",
          300: "#b4b4bc",
          200: "#d6d6dc",
          100: "#eeeef1",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      animation: {
        "pulse-ring": "pulseRing 1.6s ease-out infinite",
        "fade-in": "fadeIn 200ms ease-out",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.85)", opacity: "0.9" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
