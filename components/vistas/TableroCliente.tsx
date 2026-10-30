import Link from "next/link";
import { crearCliente, guardarMwh, guardarPct, marcarPagado, moverFase, restablecerContrasena, sacarDelArchivo } from "@/app/actions";
import { CampoContrasena } from "@/components/CampoContrasena";
import { Avatar } from "@/components/Avatar";
import { FormAviso } from "@/components/FormAviso";
import { FormEstado } from "@/components/FormEstado";
import { Submit } from "@/components/Submit";
import { FASES, FASE_COLOR, VALOR_MWH, eur, fecha } from "@/lib/utils";
import type { ClienteStaff, Profile } from "@/lib/types";

export function TableroCliente({ col, clientes, verArchivados, esAdmin = false }: { col: Profile; clientes: ClienteStaff[]; verArchivados: boolean; esAdmin?: boolean }) {
  const lista = clientes.filter((c) => (verArchivados ? !!c.archivado_at : !c.archivado_at));
  const id = col.id;
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
