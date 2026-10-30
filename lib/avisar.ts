"use client";
export type Aviso = { texto: string; tipo: "ok" | "error" };
/** Muestra un aviso breve en pantalla (lo pinta <Toaster /> montado en el layout raíz). */
export function avisar(texto: string, tipo: Aviso["tipo"] = "ok") {
  window.dispatchEvent(new CustomEvent<Aviso>("iner:aviso", { detail: { texto, tipo } }));
}
