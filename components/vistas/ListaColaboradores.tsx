import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Embudo, Kpi } from "@/components/Fase";
import { cx, eur, eur0 } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export type FilaColab = { p: Profile; n: number; pendientes: number; porCobrar: number; valor: number; porFase: number[] };

const FILTROS = [["todos", "Todos"], ["pendientes", "Con pagos solicitados"], ["invitados", "Aún no han entrado"]] as const;

export function ListaColaboradores({ filas, tot, conteos, q, f, esAdmin }: {
  filas: FilaColab[]; tot: { n: number; pend: number; valor: number; porCobrar: number }; conteos: number[]; q: string; f: string; esAdmin: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.02em]">Colaboradores</h1>
          <p className="text-muted">Clientes en curso y pagos de toda la red.</p>
        </div>
        {esAdmin && <Link href="/equipo/invitar" className="btn btn-primary">Crear colaborador</Link>}
      </div>

      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="tarjeta p-6">
          <h2 className="mb-3 font-bold">Recorrido de todos los clientes activos</h2>
          {tot.n === 0 ? <p className="rounded-xl bg-soft p-4 text-sm text-muted">Todavía no hay clientes activos.</p> : <Embudo conteos={conteos} />}
        </div>
        <Kpi tono="marca" etiqueta="Comisión por pagar" valor={eur0(tot.porCobrar)}
          nota={tot.pend > 0 ? `${tot.pend} pago${tot.pend > 1 ? "s" : ""} solicitado${tot.pend > 1 ? "s" : ""} por los colaboradores` : "Ningún pago solicitado ahora mismo"} />
      </section>

      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Kpi etiqueta="Clientes activos" valor={String(tot.n)} />
        <Kpi tono="sun" etiqueta="Pagos solicitados" valor={String(tot.pend)} />
        <Kpi tono="net" etiqueta="Valor CAE en curso" valor={eur0(tot.valor)} />
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro">
          {FILTROS.map(([k, t]) => (
            <Link key={k} href={`/equipo?f=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={f === k ? "true" : undefined}
              className={cx("rounded-full px-4 py-1.5 text-sm font-semibold transition-colors", f === k ? "bg-ink text-white" : "bg-panel text-muted shadow-card hover:text-ink")}>{t}</Link>
          ))}
        </div>
        <form className="flex w-full items-center gap-2 sm:w-auto">
          <input type="hidden" name="f" value={f} />
          <label className="sr-only" htmlFor="q">Buscar colaborador</label>
          <input id="q" name="q" defaultValue={q} placeholder="Buscar por nombre o correo" className="input min-w-0 flex-1 !bg-panel sm:w-72 sm:flex-none" />
          <button className="btn btn-ghost">Buscar</button>
        </form>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filas.length === 0 && <li className="tarjeta col-span-full p-10 text-center text-muted">No hay colaboradores con este filtro.</li>}
        {filas.map((r) => (
          <li key={r.p.id} className="flex min-w-0">
            <Link href={`/equipo/colaboradores/${r.p.id}`} className="tarjeta block w-full min-w-0 p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex items-start gap-3">
                <Avatar nombre={r.p.nombre ?? r.p.email} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{r.p.nombre ?? r.p.email}</p>
                  <p className="truncate text-xs text-muted">{r.p.email}</p>
                </div>
                {r.pendientes > 0 && <span className="latido shrink-0 rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold text-white">{r.pendientes} pago{r.pendientes > 1 ? "s" : ""}</span>}
              </div>
              {r.p.estado === "invitado" && <p className="mt-3 inline-block rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-muted">Aún no ha entrado</p>}
              <div className="mt-4"><Embudo conteos={r.porFase} compacto /></div>
              <dl className="mt-4 flex justify-between text-sm">
                <div><dt className="text-xs text-muted">Clientes</dt><dd className="num text-lg">{r.n}</dd></div>
                <div className="text-right"><dt className="text-xs text-muted">Por pagar</dt><dd className="num text-lg">{eur(r.porCobrar)}</dd></div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
