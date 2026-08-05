import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef4fb",
          100: "#d6e4f2",
          200: "#adc8e5",
          300: "#7ba3d1",
          400: "#4a7ab6",
          500: "#2f5c96",
          600: "#234876",
          700: "#1b3860",
          800: "#152c4c",
          900: "#0f2740",
          950: "#08182a",
        },
        gold: {
          50: "#fdf8ec",
          100: "#faedca",
          200: "#f4d992",
          300: "#eec25a",
          400: "#e9a319",
          500: "#d98c10",
          600: "#bd6c0d",
          700: "#9a4e10",
          800: "#7e3e14",
          900: "#6b3414",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(30px, -40px) scale(1.08)" },
        },
        "float-slow2": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-40px, 30px) scale(1.12)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(-10%, -10%) rotate(0deg)" },
          "50%": { transform: "translate(10%, 10%) rotate(180deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out forwards",
        "fade-in": "fade-in 0.9s ease-out forwards",
        "float-slow": "float-slow 14s ease-in-out infinite",
        "float-slow2": "float-slow2 18s ease-in-out infinite",
        aurora: "aurora 22s linear infinite",
        shimmer: "shimmer 3s linear infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        "pulse-ring": "pulse-ring 2.4s ease-out infinite",
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
