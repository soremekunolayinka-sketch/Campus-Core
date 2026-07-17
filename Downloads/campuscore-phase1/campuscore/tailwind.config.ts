import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Design-system tokens (Blueprint instruction #6) — centralised here
        // so every module pulls from the same palette rather than one-off hex codes.
        brand: {
          DEFAULT: "#1E4B8F",
          foreground: "#FFFFFF"
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F5F7FA"
        }
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem"
      }
    }
  },
  plugins: []
};

export default config;
