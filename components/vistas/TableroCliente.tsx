import Link from "next/link";
import { crearCliente, guardarMwh, guardarPct, marcarPagado, moverFase, restablecerContrasena, sacarDelArchivo } from "@/app/actions";
import { CampoContrasena } from "@/components/CampoContrasena";
import { Avatar } from "@/components/Avatar";
import { Kpi, KpiFila } from "@/components/Fase";
import { Barras } from "@/components/Graficos";
import { FormAviso } from "@/components/FormAviso";
import { FormEstado } from "@/components/FormEstado";
import { Submit } from "@/components/Submit";
import { FASES, FASE_COLOR, VALOR_MWH, claveMes, eur, eur0, fecha, num, ultimosMeses } from "@/lib/utils";
import type { ClienteStaff, Profile } from "@/lib/types";

export function TableroCliente({ col, clientes, verArchivados, esAdmin = false }: { col: Profile; clientes: ClienteStaff[]; verArchivados: boolean; esAdmin?: boolean }) {
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
    <div className="space-y-5">
      <div className="tarjeta flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar nombre={col.nombre ?? col.email} tamano="lg" />
          <div>
            <Link href="/equipo" className="text-sm font-semibold text-net-700 underline underline-offset-2">Colaboradores</Link>
            <h1 className="text-2xl font-bold tracking-[-0.02em]">{col.nombre ?? col.email}</h1>
            <p className="text-sm text-muted">{col.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/equipo/mensajes?c=${id}`} className="btn btn-ghost">Mensajes</Link>
          <Link href={`/equipo/colaboradores/${id}${verArchivados ? "" : "?archivados=1"}`} className="btn btn-ghost">{verArchivados ? "Ver activos" : "Ver archivados"}</Link>
        </div>
      </div>

      <section aria-labelledby="pagos" className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
          <Kpi tono="marca" etiqueta="Pagado hasta hoy" valor={eur(totalPagado)}
            nota={pagados.length ? `${pagados.length} pago${pagados.length > 1 ? "s" : ""} realizado${pagados.length > 1 ? "s" : ""}. Último: ${fecha(pagados[0].pagado_at)}` : "Todavía no se le ha pagado ningún cliente"} />
          <div className="tarjeta p-5 sm:p-6">
            <p className="eyebrow">Pagos</p>
            <h2 id="pagos" className="mb-3 text-2xl font-bold">Pagado mes a mes</h2>
            {pagados.length === 0
              ? <p className="rounded-xl bg-soft p-6 text-center text-sm text-muted">Cuando marques un cliente como pagado, aparecerá aquí.</p>
              : <Barras titulo="Importe pagado a este colaborador por mes" meses={meses.map((m) => m.etiqueta)} series={[{ nombre: "Pagado", color: "#0EA394", valores: porMes }]} formato={eur0} />}
          </div>
        </div>
        <KpiFila items={[
          { tono: "sun", etiqueta: "Pendiente de pagar", valor: eur(suma(porPagar)), nota: `${porPagar.length} cliente${porPagar.length === 1 ? "" : "s"} con CAE expedido · ${solicitados.length} con pago solicitado` },
          { tono: "net", etiqueta: "En tramitación", valor: eur(suma(enTramitacion)), nota: `${enTramitacion.length} cliente${enTramitacion.length === 1 ? "" : "s"} sin CAE expedido` },
        ]} />
        {pagados.length > 0 && (
          <details className="tarjeta group p-5 sm:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="text-lg font-bold">Detalle de pagos <span className="text-sm font-normal text-muted">({pagados.length})</span></span>
              <span aria-hidden className="text-xl leading-none text-muted transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="mt-3 max-h-96 overflow-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="sticky top-0 bg-panel text-xs text-muted">
                  <tr><th className="pb-2 font-semibold">Fecha de pago</th><th className="pb-2 font-semibold">Cliente</th><th className="pb-2 text-right font-semibold">MWh</th><th className="pb-2 text-right font-semibold">% colaborador</th><th className="pb-2 text-right font-semibold">Importe</th></tr>
                </thead>
                <tbody className="divide-y divide-line border-t border-line">
                  {pagados.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5">{fecha(c.pagado_at)}</td>
                      <td className="py-2.5 font-semibold">{c.nombre}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums">{num(c.mwh)}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums">{num(c.pct)} %</td>
                      <td className="py-2.5 text-right font-mono font-bold tabular-nums">{eur(comision(c))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-line"><tr><td colSpan={4} className="pt-3 font-bold">Total pagado</td><td className="pt-3 text-right font-mono font-bold tabular-nums">{eur(totalPagado)}</td></tr></tfoot>
              </table>
            </div>
          </details>
        )}
      </section>

      {esAdmin && (
        <details className="tarjeta group p-5">
          <summary className="cursor-pointer list-none font-bold">Cambiar contraseña de {col.nombre ?? col.email}<span className="ml-2 text-sm font-normal text-muted group-open:hidden">si la ha olvidado o quieres renovarla</span></summary>
          <FormEstado action={restablecerContrasena} className="mt-4 max-w-md space-y-4">
            <input type="hidden" name="colaborador_id" value={id} />
            <CampoContrasena />
            <Submit className="btn-primary" pendiente="Guardando…">Guardar contraseña</Submit>
          </FormEstado>
        </details>
      )}

      {!verArchivados && (
        <FormEstado action={crearCliente} className="tarjeta flex flex-wrap items-end gap-3 p-5">
          <input type="hidden" name="colaborador_id" value={id} />
          <div className="min-w-[14rem] flex-1">
            <label className="label" htmlFor="nombre">Nuevo cliente de {col.nombre ?? col.email}</label>
            <input id="nombre" name="nombre" required maxLength={200} className="input" placeholder="Nombre o razón social" />
          </div>
          <Submit className="btn-primary" pendiente="Añadiendo…">Añadir cliente</Submit>
        </FormEstado>
      )}

      {verArchivados ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.length === 0 && <li className="tarjeta col-span-full p-10 text-center text-muted">No hay clientes archivados.</li>}
          {lista.map((c) => (
            <li key={c.id} className="tarjeta p-5">
              <p className="font-bold">{c.nombre}</p>
              <p className="text-sm text-muted">Pagado el {fecha(c.pagado_at)} · archivado el {fecha(c.archivado_at)}</p>
              <FormAviso action={sacarDelArchivo} className="mt-3"><input type="hidden" name="id" value={c.id} /><button className="btn btn-ghost !py-1.5">Sacar del archivo</button></FormAviso>
            </li>
          ))}
        </ul>
      ) : (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {FASES.map((nombreFase, fase) => {
            const enFase = lista.filter((c) => c.fase === fase);
            return (
              <section key={nombreFase} aria-label={nombreFase} className="min-w-[17.5rem] snap-start rounded-[18px] bg-soft p-3 lg:min-w-0">
                <h2 className="mb-3 flex items-center justify-between gap-2 px-1.5 text-sm font-bold">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: FASE_COLOR[fase] }} />{nombreFase}</span>
                  <span className="rounded-full bg-panel px-2.5 text-xs font-bold shadow-card">{enFase.length}</span>
                </h2>
                <ul className="space-y-3">
                  {enFase.length === 0 && <li className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-faint">Sin clientes</li>}
                  {enFase.map((c) => (
                    <li key={c.id} className="rounded-xl bg-panel p-3.5 text-sm shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift" style={{ borderLeft: `4px solid ${FASE_COLOR[fase]}` }}>
                      <p className="font-bold leading-tight">{c.nombre}</p>
                      <FormAviso action={guardarMwh} className="mt-3 flex items-end gap-1.5">
                        <input type="hidden" name="id" value={c.id} />
                        <div className="flex-1"><label className="text-xs text-muted" htmlFor={`mwh-${c.id}`}>MWh</label><input id={`mwh-${c.id}`} name="mwh" inputMode="decimal" defaultValue={c.mwh ?? ""} className="input !py-1.5 font-mono" /></div>
                        <button className="btn btn-ghost !px-2.5 !py-1.5">Guardar</button>
                      </FormAviso>
                      <FormAviso action={guardarPct} className="mt-2 flex items-end gap-1.5">
                        <input type="hidden" name="id" value={c.id} />
                        <div className="flex-1"><label className="text-xs text-muted" htmlFor={`pct-${c.id}`}>% del colaborador</label><input id={`pct-${c.id}`} name="pct" inputMode="decimal" defaultValue={c.pct} className="input !py-1.5 font-mono" /></div>
                        <button className="btn btn-ghost !px-2.5 !py-1.5">Guardar</button>
                      </FormAviso>
                      <dl className="mt-3 space-y-1 border-t border-line pt-2.5 text-xs text-muted">
                        <div className="flex justify-between gap-2"><dt>Valor</dt><dd className="font-mono tabular-nums">{eur((c.mwh ?? 0) * VALOR_MWH)}</dd></div>
                        <div className="flex items-baseline justify-between gap-2"><dt>Comisión</dt><dd className="num text-base text-ink">{eur((c.mwh ?? 0) * VALOR_MWH * c.pct / 100)}</dd></div>
                      </dl>
                      {c.pago === "requested" && <p className="mt-2 rounded-lg bg-sun-50 px-2.5 py-1.5 text-xs font-bold text-sun-700">Pago solicitado el {fecha(c.solicitado_at)}</p>}
                      {c.pago === "paid" && <p className="mt-2 rounded-lg bg-batt-50 px-2.5 py-1.5 text-xs font-bold text-batt-700">Pagado el {fecha(c.pagado_at)}</p>}
                      <div className="mt-3 flex items-center gap-1.5">
                        <FormAviso action={moverFase}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="-1" /><button disabled={fase === 0} aria-label="Volver a la fase anterior" className="btn btn-ghost !px-3 !py-1.5">←</button></FormAviso>
                        <FormAviso action={moverFase}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="1" /><button disabled={fase === 4} aria-label="Pasar a la fase siguiente" className="btn btn-ghost !px-3 !py-1.5">→</button></FormAviso>
                      </div>
                      {fase === 4 && c.pago !== "paid" && (
                        <FormAviso action={marcarPagado} className="mt-2"><input type="hidden" name="id" value={c.id} /><button className="btn btn-primary w-full !py-1.5">Marcar como pagado</button></FormAviso>
                      )}
                    </li>
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
