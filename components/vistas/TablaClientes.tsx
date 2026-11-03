"use client";
import { Fragment, useMemo, useState } from "react";
import { solicitarPago } from "@/app/actions";
import { FormAviso } from "@/components/FormAviso";
import { Recorrido } from "@/components/Fase";
import { Submit } from "@/components/Submit";
import { FASES, FASE_COLOR, cx, eur, fecha, num } from "@/lib/utils";
import type { ClienteColab } from "@/lib/types";

const ORDENES = [
  ["reciente", "Más recientes"], ["nombre", "Nombre (A-Z)"], ["fase", "Fase (más avanzada primero)"], ["comision", "Comisión (mayor primero)"],
] as const;
type Orden = (typeof ORDENES)[number][0];

type Filtro = "todos" | "listos" | "tramite" | "solicitado" | "pagados";
const coincide: Record<Filtro, (c: ClienteColab) => boolean> = {
  todos: () => true,
  listos: (c) => c.fase === 4 && c.pago === "none",
  tramite: (c) => c.fase < 4,
  solicitado: (c) => c.pago === "requested",
  pagados: (c) => c.pago === "paid",
};

/** Las cinco fases con la fecha en que se alcanzó cada una, y las del pago debajo. */
function Linea({ c, fechas }: { c: ClienteColab; fechas: (string | null)[] }) {
  return (
    <div>
      <ol className="grid grid-cols-5 gap-1.5">
        {FASES.map((f, i) => {
          const hecho = i <= c.fase;
          return (
            <li key={f} className="text-center text-[11px] leading-tight sm:text-xs">
              <span aria-hidden className="mx-auto mb-1 block h-3.5 w-3.5 rounded-full" style={{ background: hecho ? FASE_COLOR[i] : "#E5E7EB" }} />
              <span className={cx("block font-semibold", hecho ? "text-ink" : "text-muted")}>{f}</span>
              <span className="block text-muted">{hecho ? fecha(fechas[i] ?? null) : "Pendiente"}</span>
            </li>
          );
        })}
      </ol>
      {(c.solicitado_at || c.pagado_at) && (
        <p className="mt-2 text-center text-xs text-muted">
          {c.solicitado_at && <>Pago solicitado el {fecha(c.solicitado_at)}</>}{c.solicitado_at && c.pagado_at && " · "}{c.pagado_at && <>Pagado el {fecha(c.pagado_at)}</>}
        </p>
      )}
    </div>
  );
}

function Cobro({ c }: { c: ClienteColab }) {
  if (c.pago === "paid") return <span className="inline-block rounded-full bg-batt-50 px-3 py-1 text-xs font-bold text-batt-700">Pagado · {fecha(c.pagado_at)}</span>;
  if (c.pago === "requested") return <span className="inline-block rounded-full bg-sun-50 px-3 py-1 text-xs font-bold text-sun-700">Pago solicitado</span>;
  if (c.fase === 4) return <FormAviso action={solicitarPago}><input type="hidden" name="id" value={c.id} /><Submit className="btn-primary !py-1.5" pendiente="Solicitando…">Solicitar pago</Submit></FormAviso>;
  return <span className="text-xs text-muted">Podrás solicitarlo cuando se expida el CAE</span>;
}

export function TablaClientes({ clientes, vacio, fechas = {} }: { clientes: ClienteColab[]; vacio: string; fechas?: Record<string, (string | null)[]> }) {
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState<Orden>("reciente");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [abierto, setAbierto] = useState<string | null>(null);
  const conteo = (k: Filtro) => clientes.filter(coincide[k]).length;
  const chips = ([["todos", "Todos"], ["listos", "Listos para cobrar"], ["tramite", "En trámite"], ["solicitado", "Pago solicitado"], ["pagados", "Pagados"]] as const)
    .filter(([k]) => k === "todos" || k === filtro || conteo(k) > 0);
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    const f = clientes.filter((c) => coincide[filtro](c) && (!t || c.nombre.toLowerCase().includes(t)));
    const cmp: Record<Orden, (a: ClienteColab, b: ClienteColab) => number> = {
      reciente: (a, b) => b.created_at.localeCompare(a.created_at),
      nombre: (a, b) => a.nombre.localeCompare(b.nombre, "es"),
      fase: (a, b) => b.fase - a.fase,
      comision: (a, b) => (b.comision ?? -1) - (a.comision ?? -1),
    };
    return [...f].sort(cmp[orden]);
  }, [clientes, q, orden, filtro]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {clientes.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar clientes">
          {chips.map(([k, t]) => (
            <button key={k} type="button" aria-pressed={filtro === k} onClick={() => setFiltro(k)}
              className={cx("rounded-full border px-3.5 py-1 text-sm font-semibold transition", filtro === k ? "border-ink bg-ink text-white" : "border-line bg-panel text-muted hover:border-ink hover:text-ink")}>
              {t} <span className="opacity-75">· {conteo(k)}</span>
            </button>
          ))}
        </div>
      )}
      {clientes.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
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
        <p className="rounded-xl bg-soft p-8 text-center text-muted">{clientes.length === 0 ? vacio : "Ningún cliente coincide con el filtro o la búsqueda."}</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="sticky top-0 z-10 bg-panel text-xs text-muted">
              <tr>
                <th className="pb-2 font-semibold">Cliente</th><th className="pb-3 font-semibold">En qué fase está</th>
                <th className="pb-3 text-right font-semibold">MWh</th><th className="pb-3 text-right font-semibold">Tu %</th>
                <th className="pb-3 text-right font-semibold">Tu comisión</th><th className="pb-3 pl-8 font-semibold">Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-t border-line">
              {lista.map((c) => (
                <Fragment key={c.id}>
                  <tr className="transition-colors hover:bg-soft/60">
                    <td className="py-3 lg:py-2 pl-3 pr-4" style={{ borderLeft: `4px solid ${FASE_COLOR[c.fase]}` }}>
                      <button type="button" onClick={() => setAbierto(abierto === c.id ? null : c.id)} aria-expanded={abierto === c.id} aria-controls={`rec-${c.id}`}
                        className="group flex w-full items-center gap-2 text-left">
                        <span className="min-w-0"><span className="block font-bold">{c.nombre}</span><span className="block text-xs text-muted">Alta {fecha(c.created_at)} · {abierto === c.id ? "ocultar recorrido" : "ver recorrido"}</span></span>
                        <span aria-hidden className={cx("ml-auto text-faint transition-transform", abierto === c.id && "rotate-90")}>›</span>
                      </button>
                    </td>
                    <td className="py-3 pr-4 lg:py-2"><Recorrido fase={c.fase} /></td>
                    <td className="py-3 lg:py-2 text-right font-mono tabular-nums">{num(c.mwh)}</td>
                    <td className="py-3 lg:py-2 text-right font-mono tabular-nums">{num(c.pct)} %</td>
                    <td className="py-3 lg:py-2 text-right font-mono font-bold tabular-nums">{eur(c.comision)}</td>
                    <td className="py-3 pl-8 lg:py-2"><Cobro c={c} /></td>
                  </tr>
                  {abierto === c.id && (
                    <tr id={`rec-${c.id}`} className="bg-soft/60"><td colSpan={6} className="px-6 py-4"><Linea c={c} fechas={fechas[c.id] ?? []} /></td></tr>
                  )}
                </Fragment>
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
                <button type="button" onClick={() => setAbierto(abierto === c.id ? null : c.id)} aria-expanded={abierto === c.id} className="mt-3 text-xs font-semibold text-net-700 underline underline-offset-2">
                  {abierto === c.id ? "Ocultar recorrido" : "Ver recorrido"}
                </button>
                {abierto === c.id && <div className="mt-3 border-t border-line pt-3"><Linea c={c} fechas={fechas[c.id] ?? []} /></div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
