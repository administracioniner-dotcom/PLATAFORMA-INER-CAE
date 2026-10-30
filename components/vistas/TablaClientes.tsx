"use client";
import { useMemo, useState } from "react";
import { solicitarPago } from "@/app/actions";
import { FormAviso } from "@/components/FormAviso";
import { Recorrido } from "@/components/Fase";
import { Submit } from "@/components/Submit";
import { FASE_COLOR, eur, fecha, num } from "@/lib/utils";
import type { ClienteColab } from "@/lib/types";

const ORDENES = [
  ["reciente", "Más recientes"], ["nombre", "Nombre (A-Z)"], ["fase", "Fase (más avanzada primero)"], ["comision", "Comisión (mayor primero)"],
] as const;
type Orden = (typeof ORDENES)[number][0];

function Cobro({ c }: { c: ClienteColab }) {
  if (c.pago === "paid") return <span className="inline-block rounded-full bg-batt-50 px-3 py-1 text-xs font-bold text-batt-700">Pagado · {fecha(c.pagado_at)}</span>;
  if (c.pago === "requested") return <span className="inline-block rounded-full bg-sun-50 px-3 py-1 text-xs font-bold text-sun-700">Pago solicitado</span>;
  if (c.fase === 4) return <FormAviso action={solicitarPago}><input type="hidden" name="id" value={c.id} /><Submit className="btn-primary !py-1.5" pendiente="Solicitando…">Solicitar pago</Submit></FormAviso>;
  return <span className="text-xs text-muted">Podrás solicitarlo cuando se expida el CAE</span>;
}

export function TablaClientes({ clientes, vacio }: { clientes: ClienteColab[]; vacio: string }) {
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState<Orden>("reciente");
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    const f = clientes.filter((c) => !t || c.nombre.toLowerCase().includes(t));
    const cmp: Record<Orden, (a: ClienteColab, b: ClienteColab) => number> = {
      reciente: (a, b) => b.created_at.localeCompare(a.created_at),
      nombre: (a, b) => a.nombre.localeCompare(b.nombre, "es"),
      fase: (a, b) => b.fase - a.fase,
      comision: (a, b) => (b.comision ?? -1) - (a.comision ?? -1),
    };
    return [...f].sort(cmp[orden]);
  }, [clientes, q, orden]);

  return (
    <>
      {clientes.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="buscar-cliente">Buscar cliente</label>
          <input id="buscar-cliente" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente" className="input min-w-0 basis-full sm:flex-1 sm:basis-auto sm:max-w-xs" />
          <label className="sr-only" htmlFor="orden-cliente">Ordenar por</label>
          <select id="orden-cliente" value={orden} onChange={(e) => setOrden(e.target.value as Orden)} className="input !w-auto">
            {ORDENES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
          <p className="ml-auto text-xs text-muted" aria-live="polite">{lista.length} de {clientes.length}</p>
        </div>
      )}
      {lista.length === 0 ? (
        <p className="rounded-xl bg-soft p-8 text-center text-muted">{clientes.length === 0 ? vacio : "Ningún cliente coincide con la búsqueda."}</p>
      ) : (
        <>
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="text-xs text-muted">
              <tr>
                <th className="pb-3 font-semibold">Cliente</th><th className="pb-3 font-semibold">En qué fase está</th>
                <th className="pb-3 text-right font-semibold">MWh</th><th className="pb-3 text-right font-semibold">Tu %</th>
                <th className="pb-3 text-right font-semibold">Tu comisión</th><th className="pb-3 pl-8 font-semibold">Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-t border-line">
              {lista.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-soft/60">
                  <td className="py-4 pl-3 pr-4" style={{ borderLeft: `4px solid ${FASE_COLOR[c.fase]}` }}><span className="font-bold">{c.nombre}</span><span className="block text-xs text-muted">Alta {fecha(c.created_at)}</span></td>
                  <td className="py-4 pr-4"><Recorrido fase={c.fase} /></td>
                  <td className="py-4 text-right font-mono tabular-nums">{num(c.mwh)}</td>
                  <td className="py-4 text-right font-mono tabular-nums">{num(c.pct)} %</td>
                  <td className="py-4 text-right font-mono font-bold tabular-nums">{eur(c.comision)}</td>
                  <td className="py-4 pl-8"><Cobro c={c} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="space-y-3 md:hidden">
            {lista.map((c) => (
              <li key={c.id} className="rounded-xl bg-soft p-4" style={{ borderLeft: `4px solid ${FASE_COLOR[c.fase]}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-bold">{c.nombre}</p><p className="text-xs text-muted">Alta {fecha(c.created_at)}</p></div>
                  <p className="num text-lg">{eur(c.comision)}</p>
                </div>
                <div className="mt-3"><Recorrido fase={c.fase} /></div>
                <p className="mt-2 font-mono text-xs text-muted">{num(c.mwh)} MWh · tu {num(c.pct)} %</p>
                <div className="mt-3"><Cobro c={c} /></div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
