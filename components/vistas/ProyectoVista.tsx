import { DocsCliente, type DocCliente } from "@/components/vistas/DocsCliente";
import { Anillo, Importe } from "@/components/vistas/ProyectoAnimado";
import type { ClienteDirecto, FichaTipo, ObsFase } from "@/lib/types";
import { FASES, FASE_FINAL, cx, fecha, fechaHora, num, primerNombre } from "@/lib/utils";

const DETALLE = [
  "INER está calculando cuántos CAE puede generar tu actuación.",
  "Has aceptado el contrato y arranca la tramitación.",
  "Un organismo verificador está revisando tu expediente.",
  "El gestor autonómico está validando tu expediente en tu comunidad autónoma.",
  "El expediente se está tramitando ante el MITECO.",
  "Tu CAE está expedido. INER te paga el importe acordado.",
];

/** Pantalla «Mi proyecto» del cliente: solo presenta los datos que le pasan. */
export function ProyectoVista({ nombre, cli, ficha: f2, mios, obs }: { nombre: string; cli: ClienteDirecto; ficha: FichaTipo | null; mios: DocCliente[]; obs: ObsFase[] }) {
  const faltan = mios.filter((d) => !d.listo).length;
  const importe = cli.mwh == null ? null : cli.mwh * cli.precio_mwh;
  const porFase = (i: number) => obs.filter((o) => o.fase === i);
  const f = cli.fase;
  const pct = Math.round(((f + 1) / FASES.length) * 100);
  const pagado = !!cli.cobrado_at;
  const ultimoPaso = (ok: boolean) => (ok ? "opacity-100" : "opacity-65");

  return (
    <div className="space-y-5">
      {/* Cabecera: dónde está el proyecto de un vistazo */}
      <section className="relative grid items-center gap-5 overflow-hidden rounded-3xl p-6 text-white sm:grid-cols-[1fr_auto] sm:p-9"
        style={{ background: "radial-gradient(900px 300px at 85% -20%, rgba(234,84,9,.55), transparent 60%), radial-gradient(600px 300px at 0% 120%, rgba(14,163,148,.35), transparent 60%), linear-gradient(135deg, #021037, #0B2A6B)" }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.06em] text-white/70">Tu proyecto{f2 && <> · {f2.codigo}</>}</p>
          <h1 className="mt-1.5 text-[clamp(1.9rem,5vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.02em]">Hola, <span className="capitalize">{primerNombre(nombre)}</span></h1>
          <p className="mt-1.5 text-white/85">{f2?.nombre ?? "Tu proyecto"}</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-sm font-semibold backdrop-blur">
            <span className="punto-vivo h-2.5 w-2.5 rounded-full bg-marca" aria-hidden />Fase {f + 1} de {FASES.length} · {FASES[f]}
          </span>
          <p className="mt-3 max-w-[46ch] text-white/90">{DETALLE[f]}{faltan > 0 && <> <b>Te {faltan === 1 ? "falta 1 documento" : `faltan ${faltan} documentos`}.</b></>}</p>
        </div>
        <Anillo pct={pct} />
      </section>

      {/* Línea de fases con las observaciones de INER justo debajo de cada una */}
      <section className="tarjeta p-5" aria-label="Seguimiento del expediente">
        <ol className="grid sm:grid-cols-6">
          {FASES.map((nombreFase, i) => {
            const estado = i < f ? "hecha" : i === f ? "ahora" : "pendiente";
            const notas = porFase(i);
            return (
              <li key={nombreFase} aria-current={estado === "ahora" ? "step" : undefined}
                className="relative flex gap-3 pb-5 last:pb-0 sm:flex-col sm:items-center sm:pb-0 sm:text-center">
                {i < FASE_FINAL && <span aria-hidden className="absolute bottom-0 left-[14.5px] top-8 w-[3px] rounded bg-line sm:bottom-auto sm:left-1/2 sm:top-[14.5px] sm:h-[3px] sm:w-full" />}
                {i < f && <span aria-hidden className="llena absolute bottom-0 left-[14.5px] top-8 w-[3px] rounded bg-batt sm:bottom-auto sm:left-1/2 sm:top-[14.5px] sm:h-[3px] sm:w-full" />}
                <span className={cx("relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-[3px] text-sm font-bold",
                  estado === "hecha" ? "border-batt bg-batt text-white" : "bg-panel", estado === "ahora" && "paso-ahora border-marca text-marca", estado === "pendiente" && "border-line text-faint")}>
                  {estado === "hecha" ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1 sm:w-full sm:flex-none sm:px-1">
                  <p className={cx("text-sm leading-tight", estado === "ahora" ? "font-bold" : "font-semibold text-muted")}>{nombreFase}</p>
                  {notas.map((o) => (
                    <div key={o.id} className={cx("nota-obs mt-2 rounded-xl border px-2.5 py-1.5 text-left text-[12.5px] leading-snug", estado === "ahora" ? "border-marca/35 bg-sun-50" : "border-line bg-soft")}>
                      <span className="block">{o.texto}</span>
                      <small className="mt-0.5 block text-[11px] text-faint">INER · {fechaHora(o.created_at)}</small>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <DocsCliente docs={mios} />
        <aside className="space-y-5">
          <section className="rounded-[18px] p-5 text-white shadow-card"
            style={{ background: "radial-gradient(500px 220px at 100% 0, rgba(234,84,9,.5), transparent 60%), linear-gradient(140deg, #021037, #0B2A6B)" }}>
            <p className="text-xs font-semibold uppercase tracking-[.03em] text-white/75">Lo que vas a cobrar</p>
            {importe == null
              ? <><p className="num mt-1 text-4xl leading-tight">—</p><p className="text-sm text-white/80">Todavía estamos calculando los MWh de tu actuación.</p></>
              : <><Importe valor={importe} className="num mt-0.5 block text-[clamp(2.2rem,8vw,3rem)] leading-[1.05]" /><p className="text-sm text-white/80">{num(cli.mwh)} MWh × {num(cli.precio_mwh)} €/MWh</p></>}
            <div className="mt-5 flex items-center" aria-label="Camino del pago">
              {[["En tramitación", f < FASE_FINAL], ["CAE expedido", f === FASE_FINAL && !pagado], ["Pagado por INER", pagado]].map(([t, on], i) => (
                <div key={t as string} className={cx("flex flex-1 items-center", ultimoPaso(on as boolean))}>
                  {i > 0 && <span aria-hidden className="mb-5 h-0.5 flex-1 bg-white/25" />}
                  <div className="flex-1 text-center text-[11.5px] font-semibold">
                    <i className={cx("mx-auto mb-1.5 block h-3.5 w-3.5 rounded-full not-italic", on ? "bg-marca shadow-[0_0_0_5px_rgba(234,84,9,.3)]" : "bg-white/30")} />{t as string}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-white/80">
              {pagado ? <>Pagado el <b>{fecha(cli.cobrado_at)}</b>.</> : <>Te lo paga INER. Aquí verás cuándo esté pagado.</>}
            </p>
          </section>
          <section className="tarjeta p-5">
            <p className="etiqueta">Tu contacto en INER</p>
            <p className="mt-1 text-sm text-muted">
              <a href="tel:+34900848402" className="inline-block py-1 font-semibold text-ink underline-offset-2 hover:underline">+34 900 84 84 02</a><br />
              <a href="mailto:info@iner.es" className="inline-block py-1 font-semibold text-ink underline-offset-2 hover:underline">info@iner.es</a>
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
