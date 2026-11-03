"use client";
import { useEffect, useRef } from "react";
import { latirPresencia } from "@/app/actions";

/** Mientras el equipo tiene esta conversación a la vista y la ventana en primer plano, avisa al servidor cada 25 s para no mandarle correo de lo que ya está viendo. */
export function PresenciaEquipo({ colaboradorId }: { colaboradorId: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const latir = () => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;
      if (!ref.current || ref.current.getClientRects().length === 0) return; // en móvil, la lista no cuenta
      latirPresencia(colaboradorId).catch(() => {});
    };
    latir();
    const id = setInterval(latir, 25_000);
    document.addEventListener("visibilitychange", latir);
    window.addEventListener("focus", latir);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", latir); window.removeEventListener("focus", latir); };
  }, [colaboradorId]);
  return <span ref={ref} aria-hidden className="block h-0" />;
}
