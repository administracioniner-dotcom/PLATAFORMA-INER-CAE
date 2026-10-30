import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta tomada de iner.es: azul marino, naranja de marca y grises fríos muy claros.
        bg: "#F9FAFB", panel: "#FFFFFF", soft: "#F3F4F6", ink: "#021037", navy2: "#101E45", muted: "#4A5565", faint: "#6B7280", line: "#E5E7EB",
        marca: "#EA5409", // naranja de marca: solo para rellenos y detalles grandes
        cta: { DEFAULT: "#C94607", dark: "#9A3309" }, // naranja de botones y textos pequeños (contraste AA con texto blanco)
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
