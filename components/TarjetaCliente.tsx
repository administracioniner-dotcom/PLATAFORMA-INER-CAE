"use client";
import { useState } from "react";
import { eliminarCliente, guardarDatosCliente, marcarPagado, moverFase } from "@/app/actions";
import { FormAviso } from "@/components/FormAviso";
import { Submit } from "@/components/Submit";
import { FASE_COLOR, VALOR_MWH, eur, fecha, num, FASE_FINAL } from "@/lib/utils";

export type DatosTarjeta = {
  id: string; nombre: string; fase: number; mwh: number | null; pct: number; precio_mwh: number;
  pago: "none" | "requested" | "paid"; solicitado_at: string | null; pagado_at: string | null;
  /** Calculada en el servidor: el precio por MWh no viaja al navegador. */
  comision: number;
};

function Insignia({ c }: { c: DatosTarjeta }) {
  if (c.pago === "paid") return <span className="shrink-0 rounded-full bg-batt-50 px-2.5 py-0.5 text-xs font-bold text-batt-700">Pagado {fecha(c.pagado_at)}</span>;
  if (c.pago === "requested") return <span className="shrink-0 rounded-full bg-sun-50 px-2.5 py-0.5 text-xs font-bold text-sun-700">Pago solicitado {fecha(c.solicitado_at)}</span>;
  return null;
}

/** Cliente en el tablero: compacto por defecto; «Editar» abre nombre, MWh, porcentaje y precio con un único Guardar. */
export function TarjetaCliente({ c, puedeEliminar = false }: { c: DatosTarjeta; puedeEliminar?: boolean }) {
  const [abierta, setAbierta] = useState(false);
  const [borrando, setBorrando] = useState(false);
  return (
    <li className="rounded-xl bg-panel p-3 text-sm shadow-card" style={{ borderLeft: `4px solid ${FASE_COLOR[c.fase]}` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold leading-tight">{c.nombre}</p>
        <Insignia c={c} />
      </div>
      <p className="mt-1 text-xs text-muted">
        {c.mwh == null
          ? <span className="font-semibold text-sun-700">Sin MWh todavía</span>
          : <><span className="font-mono">{num(c.mwh)} MWh · {num(c.pct)} %{c.precio_mwh !== VALOR_MWH ? ` · ${num(c.precio_mwh)} €/MWh` : ""}</span> · Comisión <span className="num text-sm text-ink">{eur(c.comision)}</span></>}
      </p>

      {abierta && (
        <div className="mt-2.5 space-y-2 rounded-lg bg-soft p-2.5">
          <FormAviso action={guardarDatosCliente} alTerminar={(bien) => bien && setAbierta(false)} className="grid grid-cols-2 items-end gap-2">
            <input type="hidden" name="id" value={c.id} />
            <label className="col-span-2 text-xs text-muted" htmlFor={`nombre-${c.id}`}>Nombre del cliente<input id={`nombre-${c.id}`} name="nombre" required maxLength={200} defaultValue={c.nombre} className="input !bg-panel !py-1" /></label>
            <label className="text-xs text-muted" htmlFor={`mwh-${c.id}`}>MWh<input id={`mwh-${c.id}`} name="mwh" inputMode="decimal" defaultValue={c.mwh ?? ""} className="input !bg-panel !py-1 font-mono" /></label>
            <label className="text-xs text-muted" htmlFor={`pct-${c.id}`}>% colaborador<input id={`pct-${c.id}`} name="pct" inputMode="decimal" required defaultValue={c.pct} className="input !bg-panel !py-1 font-mono" /></label>
            <label className="col-span-2 text-xs text-muted" htmlFor={`precio-${c.id}`}>€ por MWh<input id={`precio-${c.id}`} name="precio_mwh" inputMode="decimal" required defaultValue={c.precio_mwh} className="input !bg-panel !py-1 font-mono" /></label>
            <p className="col-span-2 text-[11px] leading-snug text-faint">Lo normal son {VALOR_MWH} € por MWh. Cámbialo solo si a este cliente se le cobra otra cantidad.</p>
            <Submit className="btn-primary col-span-2 !py-1" pendiente="Guardando…">Guardar</Submit>
          </FormAviso>
          {puedeEliminar && (borrando ? (
            <FormAviso action={eliminarCliente} className="space-y-1.5 rounded-lg border border-red-200 bg-red-50 p-2.5">
              <input type="hidden" name="id" value={c.id} />
              <p className="text-xs text-red-800">Se borran el cliente, su historial y sus mensajes{c.pago === "paid" ? ", y se pierde un pago ya registrado" : ""}. No se puede deshacer.</p>
              <div className="flex gap-2">
                <Submit className="whitespace-nowrap rounded-full bg-red-700 !px-3 !py-1 text-xs font-semibold text-white hover:bg-red-800" pendiente="Eliminando…">Sí, eliminar</Submit>
                <button type="button" onClick={() => setBorrando(false)} className="text-xs font-semibold text-muted underline underline-offset-2">No, conservar</button>
              </div>
            </FormAviso>
          ) : (
            <button type="button" onClick={() => setBorrando(true)} className="text-xs font-semibold text-red-700 underline underline-offset-2">Eliminar cliente…</button>
          ))}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <FormAviso action={moverFase}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="-1" /><button disabled={c.fase === 0} aria-label="Volver a la fase anterior" className="btn btn-ghost !px-3 !py-0.5">←</button></FormAviso>
        <FormAviso action={moverFase}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="1" /><button disabled={c.fase === FASE_FINAL} aria-label="Pasar a la fase siguiente" className="btn btn-ghost !px-3 !py-0.5">→</button></FormAviso>
        {c.fase === FASE_FINAL && c.pago !== "paid" && (
          <FormAviso action={marcarPagado}><input type="hidden" name="id" value={c.id} /><button className="btn btn-primary !px-3 !py-0.5">Marcar pagado</button></FormAviso>
        )}
        <button type="button" onClick={() => { setAbierta(!abierta); setBorrando(false); }} aria-expanded={abierta} className="ml-auto text-xs font-semibold text-net-700 underline underline-offset-2">{abierta ? "Cerrar" : "Editar"}</button>
      </div>
    </li>
  );
}
