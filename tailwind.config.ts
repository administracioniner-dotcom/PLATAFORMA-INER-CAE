import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { navy: { DEFAULT: "#0B2545", 700: "#13315C", 100: "#E6ECF4", 50: "#F3F6FA" }, verde: { DEFAULT: "#13A66B", 50: "#E7F6EF" }, ambar: { DEFAULT: "#F5A623", 50: "#FEF3DE" } },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
