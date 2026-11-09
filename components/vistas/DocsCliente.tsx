"use client";
import { useState } from "react";
import { cx } from "@/lib/utils";

export type DocCliente = { id: string; nombre: string; ayuda: string | null; listo: boolean; grupo: string };

const Chevron = ({ abierto }: { abierto: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden
    className={cx("shrink-0 text-faint transition-transform", abierto && "rotate-90")}><path d="M9 6l6 6-6 6" /></svg>
);

/** Lo que INER necesita del cliente, en carpetas desplegables. Solo para mirar: el equipo marca lo recibido. */
export function DocsCliente({ docs }: { docs: DocCliente[] }) {
  const [modo, setModo] = useState<"pend" | "todos">("pend");
  const grupos = docs.reduce<{ nombre: string; items: DocCliente[] }[]>((a, d) => {
    const g = a.find((x) => x.nombre === d.grupo);
    if (g) g.items.push(d); else a.push({ nombre: d.grupo, items: [d] });
    return a;
  }, []);
  const primera = grupos.findIndex((g) => g.items.some((d) => !d.listo));
  const [abierta, setAbierta] = useState<number>(primera);
  const hechos = docs.filter((d) => d.listo).length;
  return (
    <section className="tarjeta p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Lo que necesitamos de ti</h2>
          {docs.length > 0 && <p className="text-sm text-muted"><b className="text-ink">{hechos} de {docs.length}</b> entregados · por carpetas</p>}
        </div>
        {docs.length > 0 && (
          <div className="flex rounded-full bg-soft p-0.5" role="group" aria-label="Qué documentos ver">
            {([["pend", "Pendientes"], ["todos", "Todos"]] as const).map(([k, t]) => (
              <button key={k} type="button" aria-pressed={modo === k} onClick={() => setModo(k)}
                className={cx("rounded-full px-3.5 py-1.5 text-sm font-semibold", modo === k ? "bg-ink text-white" : "text-muted")}>{t}</button>
            ))}
          </div>
        )}
      </div>
      {docs.length === 0 && <p className="mt-3 text-sm text-muted">Por ahora no necesitamos nada de ti.</p>}
      {docs.length > 0 && modo === "pend" && hechos === docs.length && <p className="mt-3 rounded-xl bg-batt-50 p-3 text-center text-sm font-semibold text-batt-700">✓ Lo tenemos todo, gracias</p>}
      <div className="mt-2">
        {grupos.map((g, i) => {
          const ok = g.items.filter((d) => d.listo).length;
          const completa = ok === g.items.length;
          const vis = modo === "pend" ? g.items.filter((d) => !d.listo) : g.items;
          if (modo === "pend" && completa) return null;
          const abierto = abierta === i;
          return (
            <div key={g.nombre} className="mt-2.5 overflow-hidden rounded-2xl border border-line">
              <button type="button" aria-expanded={abierto} onClick={() => setAbierta(abierto ? -1 : i)}
                className="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-soft">
                <span className={cx("grid h-9 w-9 place-items-center rounded-xl text-sm font-bold", completa ? "bg-batt-50 text-batt-700" : "bg-sun-50 text-cta")}>{completa ? "✓" : i + 1}</span>
                <span className="min-w-0"><span className="block font-bold leading-tight">{g.nombre}</span><span className="text-xs text-muted">{ok} de {g.items.length} entregados</span></span>
                <span className="hidden h-1.5 w-[70px] overflow-hidden rounded-full bg-line sm:block" aria-hidden><span className="block h-full rounded-full bg-batt transition-[width] duration-1000" style={{ width: `${(ok / g.items.length) * 100}%` }} /></span>
                <Chevron abierto={abierto} />
              </button>
              <div className={cx("grid transition-[grid-template-rows] duration-300", abierto ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <ul className="overflow-hidden">
                  {vis.map((d) => (
                    <li key={d.id} className="flex items-start justify-between gap-3 border-t border-line px-3.5 py-2.5">
                      <span><span className="block text-sm font-semibold">{d.nombre}</span>{d.ayuda && <span className="block text-xs text-muted">{d.ayuda}</span>}</span>
                      {d.listo
                        ? <span className="shrink-0 rounded-full bg-batt-50 px-2.5 py-0.5 text-xs font-bold text-batt-700">Entregado</span>
                        : <span className="shrink-0 rounded-full bg-sun-50 px-2.5 py-0.5 text-xs font-bold text-cta">Falta</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
      {docs.length > 0 && (
        <p className="mt-3 rounded-xl bg-soft px-3.5 py-2.5 text-sm text-muted">Mándanos lo que falte a <b className="text-ink">info@iner.es</b>. Lo marcamos al recibirlo y aquí pasa a «Entregado».</p>
      )}
    </section>
  );
}
