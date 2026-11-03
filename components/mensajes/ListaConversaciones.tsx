"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Iniciales } from "@/components/mensajes/Iniciales";
import { cx } from "@/lib/utils";

export type ItemLista = {
  clave: string; href: string; titulo: string; subtitulo: string; hora: string;
  noLeidos: number; color: string; iniciales: string; activo: boolean;
};

/** Lista de conversaciones (o de colaboradores) con buscador y filtro de pendientes. */
export function ListaConversaciones({ items, buscar, etiquetaPendientes, filtroInicial = "todas" }: {
  items: ItemLista[]; buscar: string; etiquetaPendientes: string; filtroInicial?: "todas" | "sin";
}) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "sin">(filtroInicial);
  const pendientes = items.filter((i) => i.noLeidos > 0).length;
  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items.filter((i) => (filtro === "todas" || i.noLeidos > 0) && (!t || i.titulo.toLowerCase().includes(t)));
  }, [items, q, filtro]);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 p-3 pb-2">
        <label className="sr-only" htmlFor="buscar-conv">{buscar}</label>
        <input id="buscar-conv" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={buscar} className="input !py-2" />
        <div className="flex gap-1.5" role="group" aria-label="Filtrar">
          {([["todas", `Todas · ${items.length}`], ["sin", `${etiquetaPendientes} · ${pendientes}`]] as const).map(([k, t]) => (
            <button key={k} type="button" aria-pressed={filtro === k} onClick={() => setFiltro(k)}
              className={cx("rounded-full border px-3 py-0.5 text-xs font-semibold transition", filtro === k ? "border-ink bg-ink text-white" : "border-line bg-panel text-muted hover:border-ink hover:text-ink")}>{t}</button>
          ))}
        </div>
      </div>
      <nav aria-label="Conversaciones" className="min-h-0 flex-1 overflow-y-auto">
        {visibles.map((i) => (
          <Link key={i.clave} href={i.href} scroll={false} aria-current={i.activo ? "true" : undefined}
            className={cx("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-line px-3 py-2.5 transition-colors hover:bg-soft", i.activo && "md:bg-sun-50")}>
            <Iniciales texto={i.iniciales} color={i.color} />
            <span className="min-w-0">
              <span className={cx("block truncate text-sm", i.noLeidos > 0 ? "font-bold" : "font-semibold")}>{i.titulo}</span>
              <span className={cx("block truncate text-xs", i.noLeidos > 0 ? "text-ink" : "text-muted")}>{i.subtitulo}</span>
            </span>
            <span className="text-right">
              <span className="block text-[11px] text-faint">{i.hora}</span>
              {i.noLeidos > 0 && <span className="mt-0.5 inline-block min-w-5 rounded-full bg-cta px-1.5 text-center text-[11px] font-bold text-white">{i.noLeidos}</span>}
            </span>
          </Link>
        ))}
        {visibles.length === 0 && <p className="border-t border-line p-4 text-sm text-muted">{filtro === "sin" && !q ? "No tienes nada pendiente." : "Nada coincide con la búsqueda."}</p>}
      </nav>
    </div>
  );
}
