"use client";
import { useEffect, useRef, useState } from "react";

/** Zona con el desplazamiento de la conversación. Baja sola al abrirla y al enviar; si llegan mensajes mientras lees más arriba, avisa en vez de moverte. */
export function FlujoMensajes({ children, clave, ultimoId, ultimoMio }: { children: React.ReactNode; clave: string; ultimoId: number | null; ultimoMio: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const abajo = useRef(true);
  const previo = useRef<{ clave: string; id: number | null } | null>(null);
  const [nuevos, setNuevos] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const p = previo.current;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!p || p.clave !== clave) { el.scrollTop = el.scrollHeight; abajo.current = true; setNuevos(false); }
    else if (p.id !== ultimoId) {
      if (ultimoMio || abajo.current) { el.scrollTo({ top: el.scrollHeight, behavior: quieto ? "auto" : "smooth" }); setNuevos(false); }
      else setNuevos(true);
    }
    previo.current = { clave, id: ultimoId };
  }, [clave, ultimoId, ultimoMio]);

  // En móvil la conversación puede estar oculta al cargarse: al hacerse visible, baja hasta el último mensaje.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visto = el.clientHeight > 0;
    const o = new ResizeObserver(() => {
      const ahora = el.clientHeight > 0;
      if (ahora && !visto) { el.scrollTop = el.scrollHeight; abajo.current = true; }
      visto = ahora;
    });
    o.observe(el);
    return () => o.disconnect();
  }, []);

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={ref} className="h-full overflow-y-auto px-4 py-3 sm:px-5"
        onScroll={(e) => { const el = e.currentTarget; abajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; if (abajo.current) setNuevos(false); }}>
        {children}
      </div>
      {nuevos && (
        <button type="button" onClick={() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" }); setNuevos(false); }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white shadow-lift">Mensajes nuevos ↓</button>
      )}
    </div>
  );
}
