"use client";
import { useEffect, useRef, useState } from "react";
import { eur0 } from "@/lib/utils";

/** Cifra en euros que sube hasta su valor al cargar (y de un valor al siguiente cuando el panel se actualiza). Sin movimiento si el sistema lo pide. */
export function Contador({ valor, className }: { valor: number; className?: string }) {
  const [v, setV] = useState(valor);
  const actual = useRef(valor);
  const primera = useRef(true);
  useEffect(() => {
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desde = primera.current ? 0 : actual.current;
    primera.current = false;
    if (quieto || desde === valor) { actual.current = valor; setV(valor); return; }
    let raf = 0; const t0 = performance.now(); const dur = 1000;
    const paso = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      const x = Math.round(desde + (valor - desde) * (1 - Math.pow(1 - p, 3)));
      actual.current = x; setV(x);
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor]);
  return <span className={className} aria-label={eur0(valor)}>{eur0(v)}</span>;
}
