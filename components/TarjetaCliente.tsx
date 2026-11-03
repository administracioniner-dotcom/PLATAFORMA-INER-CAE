"use client";
import { useState } from "react";
import { guardarDatosCliente, marcarPagado, moverFase } from "@/app/actions";
import { FormAviso } from "@/components/FormAviso";
import { Submit } from "@/components/Submit";
import { FASE_COLOR, eur, fecha, num } from "@/lib/utils";

export type DatosTarjeta = {
  id: string; nombre: string; fase: number; mwh: number | null; pct: number;
  pago: "none" | "requested" | "paid"; solicitado_at: string | null; pagado_at: string | null;
  /** Calculada en el servidor: el precio por MWh no viaja al navegador. */
  comision: number;
};

function Insignia({ c }: { c: DatosTarjeta }) {
  if (c.pago === "paid") return <span className="shrink-0 rounded-full bg-batt-50 px-2.5 py-0.5 text-xs font-bold text-batt-700">Pagado {fecha(c.pagado_at)}</span>;
  if (c.pago === "requested") return <span className="shrink-0 rounded-full bg-sun-50 px-2.5 py-0.5 text-xs font-bold text-sun-700">Pago solicitado {fecha(c.solicitado_at)}</span>;
  return null;
}

/** Cliente en el tablero: compacto por defecto; «Editar» abre MWh y porcentaje con un único Guardar. */
export function TarjetaCliente({ c }: { c: DatosTarjeta }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <li className="rounded-xl bg-panel p-3 text-sm shadow-card" style={{ borderLeft: `4px solid ${FASE_COLOR[c.fase]}` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold leading-tight">{c.nombre}</p>
        <Insignia c={c} />
      </div>
      <p className="mt-1 text-xs text-muted">
        {c.mwh == null
          ? <span className="font-semibold text-sun-700">Sin MWh todavía</span>
          : <><span className="font-mono">{num(c.mwh)} MWh · {num(c.pct)} %</span> · Comisión <span className="num text-sm text-ink">{eur(c.comision)}</span></>}
      </p>

      {abierta && (
        <FormAviso action={guardarDatosCliente} alTerminar={(bien) => bien && setAbierta(false)} className="mt-2.5 grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-lg bg-soft p-2.5">
          <input type="hidden" name="id" value={c.id} />
          <label className="text-xs text-muted" htmlFor={`mwh-${c.id}`}>MWh<input id={`mwh-${c.id}`} name="mwh" inputMode="decimal" defaultValue={c.mwh ?? ""} className="input !bg-panel !py-1 font-mono" /></label>
          <label className="text-xs text-muted" htmlFor={`pct-${c.id}`}>% colaborador<input id={`pct-${c.id}`} name="pct" inputMode="decimal" required defaultValue={c.pct} className="input !bg-panel !py-1 font-mono" /></label>
          <Submit className="btn-primary !px-4 !py-1" pendiente="…">Guardar</Submit>
        </FormAviso>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <FormAviso action={moverFase}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="-1" /><button disabled={c.fase === 0} aria-label="Volver a la fase anterior" className="btn btn-ghost !px-3 !py-0.5">←</button></FormAviso>
        <FormAviso action={moverFase}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="1" /><button disabled={c.fase === 4} aria-label="Pasar a la fase siguiente" className="btn btn-ghost !px-3 !py-0.5">→</button></FormAviso>
        {c.fase === 4 && c.pago !== "paid" && (
          <FormAviso action={marcarPagado}><input type="hidden" name="id" value={c.id} /><button className="btn btn-primary !px-3 !py-0.5">Marcar pagado</button></FormAviso>
        )}
        <button type="button" onClick={() => setAbierta(!abierta)} aria-expanded={abierta} className="ml-auto text-xs font-semibold text-net-700 underline underline-offset-2">{abierta ? "Cerrar" : "Editar"}</button>
      </div>
    </li>
  );
}
