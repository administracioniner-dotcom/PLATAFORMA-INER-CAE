import Link from "next/link";
import { crearCliente, sacarDelArchivo } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { Kpi } from "@/components/Fase";
import { Barras } from "@/components/Graficos";
import { Vacio } from "@/components/Ilustraciones";
import { TarjetaCliente } from "@/components/TarjetaCliente";
import { FormAviso } from "@/components/FormAviso";
import { FormEstado } from "@/components/FormEstado";
import { Submit } from "@/components/Submit";
import { FASES, FASE_COLOR, VALOR_MWH, claveMes, eur, eur0, fecha, num, ultimosMeses } from "@/lib/utils";
import type { ClienteStaff, Profile } from "@/lib/types";

export function TableroCliente({ col, clientes, verArchivados }: { col: Profile; clientes: ClienteStaff[]; verArchivados: boolean }) {
  const lista = clientes.filter((c) => (verArchivados ? !!c.archivado_at : !c.archivado_at));
  const id = col.id;
  // Pagos: se calculan con todos los clientes del colaborador, también los archivados.
  const comision = (c: ClienteStaff) => ((c.mwh ?? 0) * VALOR_MWH * c.pct) / 100;
  const pagados = clientes.filter((c) => c.pago === "paid").sort((a, b) => (b.pagado_at ?? "").localeCompare(a.pagado_at ?? ""));
  const totalPagado = pagados.reduce((a, c) => a + comision(c), 0);
  const porPagar = clientes.filter((c) => c.fase === 4 && c.pago !== "paid");
  const solicitados = porPagar.filter((c) => c.pago === "requested");
  const enTramitacion = clientes.filter((c) => c.fase < 4);
  const suma = (cs: ClienteStaff[]) => cs.reduce((a, c) => a + comision(c), 0);
  const meses = ultimosMeses(6);
  const porMes = meses.map((m) => suma(pagados.filter((c) => claveMes(c.pagado_at) === m.clave)));
  return (
    // En escritorio todo cabe en una pantalla: cabecera y pagos (con el alta de clientes) arriba; el tablero ocupa el resto y cada columna se desplaza por dentro.
    <div className="space-y-4 lg:flex lg:h-[calc(100dvh-5.75rem)] lg:min-h-[34rem] lg:flex-col lg:gap-4 lg:space-y-0">
      <div className="tarjeta flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar nombre={col.nombre ?? col.email} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-[-0.02em]">{col.nombre ?? col.email}</h1>
            <p className="truncate text-sm text-muted">{col.email} · <Link href="/equipo" className="font-semibold text-net-700 underline underline-offset-2">Volver a colaboradores</Link></p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/equipo/mensajes?c=${id}`} className="btn btn-ghost !py-1.5">Mensajes</Link>
          <Link href={`/equipo/colaboradores/${id}${verArchivados ? "" : "?archivados=1"}`} className="btn btn-ghost !py-1.5">{verArchivados ? "Ver activos" : "Ver archivados"}</Link>
        </div>
      </div>

      <section aria-labelledby="pagos" className={`grid shrink-0 gap-4 sm:grid-cols-2 ${verArchivados ? "lg:grid-cols-[1fr_1.7fr_1fr]" : "lg:grid-cols-[1fr_1.6fr_1fr_1fr]"}`}>
        <Kpi tono="marca" compacto etiqueta="Pagado hasta hoy" valor={eur(totalPagado)}
          nota={pagados.length ? `${pagados.length} pago${pagados.length > 1 ? "s" : ""} realizado${pagados.length > 1 ? "s" : ""}. Último: ${fecha(pagados[0].pagado_at)}` : "Todavía no se le ha pagado ningún cliente"} />
        <div className="tarjeta p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h2 id="pagos" className="text-base font-bold">Pagado mes a mes</h2>
              <p className="text-xs text-muted">Últimos seis meses, según la fecha de cada pago.</p>
            </div>
            {pagados.length > 0 && (
              <details className="group relative">
                <summary className="btn btn-ghost cursor-pointer list-none !px-4 !py-1 [&::-webkit-details-marker]:hidden">Detalle ({pagados.length})</summary>
                <div className="absolute right-0 top-full z-20 mt-2 max-h-72 w-[min(36rem,calc(100vw-3rem))] overflow-auto rounded-[18px] border border-line bg-panel p-4 shadow-lift">
                  <table className="w-full min-w-[30rem] text-left text-sm">
                    <thead className="sticky top-0 bg-panel text-xs text-muted">
                      <tr><th className="pb-2 font-semibold">Fecha de pago</th><th className="pb-2 font-semibold">Cliente</th><th className="pb-2 text-right font-semibold">MWh</th><th className="pb-2 text-right font-semibold">%</th><th className="pb-2 text-right font-semibold">Importe</th></tr>
                    </thead>
                    <tbody className="divide-y divide-line border-t border-line">
                      {pagados.map((c) => (
                        <tr key={c.id}>
                          <td className="py-2">{fecha(c.pagado_at)}</td>
                          <td className="py-2 font-semibold">{c.nombre}</td>
                          <td className="py-2 text-right font-mono tabular-nums">{num(c.mwh)}</td>
                          <td className="py-2 text-right font-mono tabular-nums">{num(c.pct)} %</td>
                          <td className="py-2 text-right font-mono font-bold tabular-nums">{eur(comision(c))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-line"><tr><td colSpan={4} className="pt-2 font-bold">Total pagado</td><td className="pt-2 text-right font-mono font-bold tabular-nums">{eur(totalPagado)}</td></tr></tfoot>
                  </table>
                </div>
              </details>
            )}
          </div>
          {pagados.length === 0
            ? <p className="rounded-xl bg-soft p-4 text-center text-sm text-muted">Cuando marques un cliente como pagado, aparecerá aquí.</p>
            : <Barras lg={{ W: 470, H: 110 }} titulo="Importe pagado a este colaborador por mes" meses={meses.map((m) => m.etiqueta)} series={[{ nombre: "Pagado", color: "#0EA394", valores: porMes }]} formato={eur0} />}
        </div>
        <dl className="tarjeta grid grid-cols-2 divide-x divide-line lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
          <div className="flex flex-col justify-center px-5 py-3">
            <dt className="etiqueta">Pendiente de pagar</dt>
            <dd className="num text-2xl text-sun-700">{eur(suma(porPagar))}</dd>
            <p className="text-xs text-muted">{porPagar.length} cliente{porPagar.length === 1 ? "" : "s"} con CAE expedido · {solicitados.length} con pago solicitado</p>
          </div>
          <div className="flex flex-col justify-center px-5 py-3">
            <dt className="etiqueta">En tramitación</dt>
            <dd className="num text-2xl text-net-700">{eur(suma(enTramitacion))}</dd>
            <p className="text-xs text-muted">{enTramitacion.length} cliente{enTramitacion.length === 1 ? "" : "s"} sin CAE expedido</p>
          </div>
        </dl>
        {!verArchivados && (
          <FormEstado action={crearCliente} className="tarjeta flex flex-col justify-center gap-2 px-4 py-3">
            <input type="hidden" name="colaborador_id" value={id} />
            <label className="text-sm font-bold" htmlFor="nombre">Nuevo cliente</label>
            <p className="text-xs text-muted">Se añade en la fase «Cálculo de CAEs».</p>
            <input id="nombre" name="nombre" required maxLength={200} className="input !py-1.5" placeholder="Nombre o razón social" />
            <Submit className="btn-primary w-full !py-1.5" pendiente="Añadiendo…">Añadir cliente</Submit>
          </FormEstado>
        )}
      </section>

      {verArchivados ? (
        <ul className="grid content-start gap-4 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:overflow-y-auto">
          {lista.length === 0 && <li className="tarjeta col-span-full p-10 text-center text-muted">No hay clientes archivados.</li>}
          {lista.map((c) => (
            <li key={c.id} className="tarjeta p-5">
              <p className="font-bold">{c.nombre}</p>
              <p className="text-sm text-muted">Pagado el {fecha(c.pagado_at)} · archivado el {fecha(c.archivado_at)}</p>
              <FormAviso action={sacarDelArchivo} className="mt-3"><input type="hidden" name="id" value={c.id} /><button className="btn btn-ghost !py-1.5">Sacar del archivo</button></FormAviso>
            </li>
          ))}
        </ul>
      ) : lista.length === 0 ? (
        <div className="lg:min-h-0 lg:flex-1">
          <Vacio icono="sol" titulo="Todavía no tiene clientes" texto="Añádelos con «Nuevo cliente»: empiezan en la fase «Cálculo de CAEs»." />
        </div>
      ) : (
        // Las fases sin clientes se quedan en una tira estrecha y las demás se reparten el ancho; cada fase se desplaza por dentro.
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)] lg:overflow-visible lg:px-0 lg:pb-0 lg:[grid-template-columns:var(--plantilla)]"
          style={{ ["--plantilla" as string]: FASES.map((_, f) => (lista.some((c) => c.fase === f) ? "minmax(0,1fr)" : "3.25rem")).join(" ") }}>
          {FASES.map((nombreFase, fase) => {
            const enFase = lista.filter((c) => c.fase === fase);
            if (enFase.length === 0) {
              return (
                <section key={nombreFase} aria-label={`${nombreFase}: sin clientes`} className="flex w-[3.25rem] shrink-0 flex-col items-center gap-3 rounded-[18px] bg-soft py-3 lg:w-auto">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: FASE_COLOR[fase] }} />
                  <span className="rounded-full bg-panel px-2 text-xs font-bold shadow-card">0</span>
                  <span className="text-xs font-bold text-muted" style={{ writingMode: "vertical-rl" }}>{nombreFase}</span>
                </section>
              );
            }
            return (
              <section key={nombreFase} aria-label={nombreFase} className="min-w-[17.5rem] shrink-0 snap-start rounded-[18px] bg-soft p-3 lg:flex lg:min-h-0 lg:min-w-0 lg:flex-col">
                <h2 className="mb-2 flex shrink-0 items-center justify-between gap-2 px-1.5 text-sm font-bold">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: FASE_COLOR[fase] }} />{nombreFase}</span>
                  <span className="rounded-full bg-panel px-2.5 text-xs font-bold shadow-card">{enFase.length}</span>
                </h2>
                <ul className="grid content-start gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))] lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                  {enFase.map((c) => (
                    <TarjetaCliente key={c.id} c={{ id: c.id, nombre: c.nombre, fase: c.fase, mwh: c.mwh, pct: c.pct, pago: c.pago, solicitado_at: c.solicitado_at, pagado_at: c.pagado_at, comision: comision(c) }} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
