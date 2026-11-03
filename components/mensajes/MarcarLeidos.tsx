"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { marcarLeidos } from "@/app/actions";

/** Marca como leídos los mensajes pendientes, pero solo si esta conversación está a la vista (en móvil, la lista no cuenta). */
export function MarcarLeidos({ colaboradorId, clienteId, pendientes }: { colaboradorId: string; clienteId: string | null; pendientes: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (pendientes === 0 || !ref.current || ref.current.getClientRects().length === 0) return;
    let vivo = true;
    marcarLeidos(colaboradorId, clienteId).then(() => { if (vivo) router.refresh(); });
    return () => { vivo = false; };
  }, [colaboradorId, clienteId, pendientes, router]);
  return <span ref={ref} aria-hidden className="block h-0" />;
}
