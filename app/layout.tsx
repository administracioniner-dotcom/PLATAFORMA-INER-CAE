import type { Metadata } from "next";
import { Titillium_Web, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const titillium = Titillium_Web({ subsets: ["latin"], weight: ["300", "400", "600", "700", "900"], variable: "--font-titillium" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
export const metadata: Metadata = { title: "Portal de colaboradores · INER", description: "Seguimiento de clientes y comisiones CAE" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${titillium.variable} ${mono.variable}`}>
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
