import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FBFAF8", panel: "#FFFFFF", soft: "#F6F4F1", ink: "#241F1A", muted: "#6B6459", faint: "#9A9186", line: "#E9E3DB",
        sun: { DEFAULT: "#F07D0A", 50: "#FEF3E6", 100: "#FDE3C7", 700: "#9A4E00" },
        batt: { DEFAULT: "#0EA394", 50: "#E4F6F3", 700: "#0A6B61" },
        net: { DEFAULT: "#2F6FE0", 50: "#E8F0FC", 700: "#1E4FA8" },
      },
      backgroundImage: { brand: "linear-gradient(135deg, #EA5409, #F8AA00)" },
      boxShadow: {
        card: "0 1px 3px rgba(36,31,26,.05), 0 8px 24px rgba(36,31,26,.04)",
        lift: "0 2px 6px rgba(36,31,26,.06), 0 14px 32px rgba(36,31,26,.08)",
      },
      fontFamily: { sans: ["var(--font-titillium)", "system-ui", "sans-serif"], mono: ["var(--font-mono)", "ui-monospace", "monospace"] },
    },
  },
  plugins: [],
} satisfies Config;
