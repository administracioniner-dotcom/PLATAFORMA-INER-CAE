"use client";
import { useState } from "react";
import { cx } from "@/lib/utils";

export type DocCliente = { id: string; nombre: string; ayuda: string | null; listo: boolean };

/** Lo que INER necesita del cliente, solo para mirar: el equipo es quien marca lo recibido. */
export function DocsCliente({ docs }: { docs: DocCliente[] }) {
  const [modo, setModo] = useState<"pend" | "todos">("pend");
  const hechos = docs.filter((d) => d.listo).length;
  const vis = modo === "pend" ? docs.filter((d) => !d.listo) : docs;
  return (
    <section className="tarjeta p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Lo que necesitamos de ti</h2>
        {docs.length > 0 && (
          <div className="flex rounded-full bg-soft p-0.5" role="group" aria-label="Qué documentos ver">
            {([["pend", "Pendientes"], ["todos", "Todos"]] as const).map(([k, t]) => (
              <button key={k} type="button" aria-pressed={modo === k} onClick={() => setModo(k)}
                className={cx("rounded-full px-3 py-0.5 text-sm font-semibold", modo === k ? "bg-ink text-white" : "text-muted")}>{t}</button>
            ))}
          </div>
        )}
      </div>
      {docs.length === 0 ? <p className="mt-3 text-sm text-muted">Por ahora no necesitamos nada de ti.</p> : (
        <>
          <p className="mt-1 text-sm text-muted">{hechos} de {docs.length} entregados</p>
          <p className="text-sm text-muted">Mándanos lo que falte por correo a info@iner.es. Aquí verás cuándo lo hayamos recibido.</p>
          {vis.length === 0 && <p className="mt-3 rounded-xl bg-batt-50 p-3 text-center text-sm font-semibold text-batt-700">✓ Lo tenemos todo, gracias</p>}
          <ul className="mt-2 divide-y divide-line">
            {vis.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-3 py-2.5">
                <span><span className="block text-sm font-semibold">{d.nombre}</span>{d.ayuda && <span className="block text-xs text-muted">{d.ayuda}</span>}</span>
                {d.listo
                  ? <span className="shrink-0 rounded-full bg-batt-50 px-2.5 py-0.5 text-xs font-bold text-batt-700">Entregado</span>
                  : <span className="shrink-0 rounded-full bg-sun-50 px-2.5 py-0.5 text-xs font-bold text-sun-700">Falta</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
