"use client";
import { useEffect, useRef, useState } from "react";
import type { Aviso } from "@/lib/avisar";

export function Toaster() {
  const [aviso, setAviso] = useState<(Aviso & { n: number }) | null>(null);
  const n = useRef(0);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const fn = (e: Event) => {
      const d = (e as CustomEvent<Aviso>).detail;
      setAviso({ ...d, n: ++n.current });
      clearTimeout(t);
      t = setTimeout(() => setAviso(null), d.tipo === "error" ? 5000 : 2200);
    };
    window.addEventListener("iner:aviso", fn);
    return () => { window.removeEventListener("iner:aviso", fn); clearTimeout(t); };
  }, []);
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      {aviso && (
        <p key={aviso.n} className={`pointer-events-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-lift ${aviso.tipo === "ok" ? "bg-ink text-white" : "bg-red-700 text-white"}`}>
          <span aria-hidden className={`h-2 w-2 rounded-full ${aviso.tipo === "ok" ? "bg-batt" : "bg-white"}`} />{aviso.texto}
        </p>
      )}
    </div>
  );
}
