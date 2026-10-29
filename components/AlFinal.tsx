"use client";
import { useEffect, useRef } from "react";

/** Marcador al final de una lista: baja hasta él al cargar y cada vez que cambia `n`. */
export function AlFinal({ n }: { n: number }) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => { ref.current?.scrollIntoView({ block: "end" }); }, [n]);
  return <li ref={ref} aria-hidden className="h-0" />;
}
