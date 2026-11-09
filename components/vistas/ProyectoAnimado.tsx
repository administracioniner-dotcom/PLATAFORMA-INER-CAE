"use client";
import { useEffect, useState } from "react";
import { eur } from "@/lib/utils";

/** Anillo con el porcentaje del camino recorrido. El trazo se dibuja al entrar. */
export function Anillo({ pct }: { pct: number }) {
  const r = 52, circ = 2 * Math.PI * r;
  return (
    <div className="relative h-[150px] w-[150px] shrink-0" role="img" aria-label={`${pct}% del camino recorrido`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="12" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#EA5409" strokeWidth="12" strokeLinecap="round" className="anillo-v"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} style={{ ["--circ" as string]: circ }} />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center text-white">
        <Contador valor={pct} formato={(n) => `${Math.round(n)}%`} className="num text-[34px] leading-none" />
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-[.06em] text-white/75">del camino</span>
      </div>
    </div>
  );
}

/** Número que cuenta hacia arriba al cargar. Sin JavaScript o sin movimiento, muestra el valor final. */
export function Contador({ valor, formato, className }: { valor: number; formato: (n: number) => string; className?: string }) {
  const [n, setN] = useState(valor);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id = 0, t0 = 0;
    const paso = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / 1200);
      setN(valor * (1 - Math.pow(1 - p, 3)));
      if (p < 1) id = requestAnimationFrame(paso);
    };
    setN(0);
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [valor]);
  return <span className={className}>{formato(n)}</span>;
}

export function Importe({ valor, className }: { valor: number; className?: string }) {
  return <Contador valor={valor} formato={eur} className={className} />;
}
