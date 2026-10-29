/* eslint-disable @next/next/no-img-element */
/** Logotipo INER (vectorial). `claro` lo pinta en blanco para fondos de color. */
export function Marca({ claro = false, className = "h-8" }: { claro?: boolean; className?: string }) {
  return <img src="/iner-logo.svg" alt="INER" className={`${className} w-auto ${claro ? "brightness-0 invert" : ""}`} />;
}
