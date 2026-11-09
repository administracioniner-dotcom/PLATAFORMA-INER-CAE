import { DocsCliente, type DocCliente } from "@/components/vistas/DocsCliente";
import type { ClienteDirecto, FichaTipo, ObsFase } from "@/lib/types";
import { FASES, cx, eur, fecha, fechaHora, num } from "@/lib/utils";

const DETALLE = [
  "INER está calculando cuántos CAE puede generar tu actuación.",
  "Has aceptado el contrato y arranca la tramitación.",
  "Un organismo verificador está revisando tu expediente.",
  "El expediente se está tramitando ante el MITECO.",
  "Tu CAE está expedido. INER te paga el importe acordado.",
];

/** Pantalla «Mi proyecto» del cliente: solo presenta los datos que le pasan. */
export function ProyectoVista({ nombre, cli, ficha: f2, mios, obs }: { nombre: string; cli: ClienteDirecto; ficha: FichaTipo | null; mios: DocCliente[]; obs: ObsFase[] }) {
  const faltan = mios.filter((d) => !d.listo).length;
  const importe = cli.mwh == null ? null : cli.mwh * cli.precio_mwh;
  const porFase = (i: number) => obs.filter((o) => o.fase === i);
  const f = cli.fase;
  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow !mb-0">Tu proyecto</p>
        <h1 className="text-3xl font-bold tracking-[-0.02em]">{f2?.nombre ?? "Tu proyecto"}</h1>
        <p className="text-muted">{nombre} {f2 && <span className="ml-1 rounded-md bg-net-50 px-2 py-0.5 text-xs font-bold tracking-wide text-net-700">{f2.codigo}</span>}</p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <section className="tarjeta p-5" aria-label="Seguimiento del expediente">
            <ol className="grid sm:grid-cols-5">
              {FASES.map((nombre, i) => {
                const estado = i < f ? "hecha" : i === f ? "ahora" : "pendiente";
                const notas = porFase(i);
                return (
                  <li key={nombre} aria-current={estado === "ahora" ? "step" : undefined}
                    className="relative flex gap-3 pb-5 last:pb-0 sm:col-span-1 sm:flex-col sm:items-center sm:pb-0 sm:text-center">
                    {i < 4 && <span aria-hidden className={cx("absolute left-[14.5px] top-8 bottom-0 w-[3px] sm:bottom-auto sm:left-1/2 sm:top-[14.5px] sm:h-[3px] sm:w-full", i < f ? "bg-batt" : "bg-line")} />}
                    <span className={cx("relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-[3px] text-sm font-bold",
                      estado === "hecha" ? "border-batt bg-batt text-white" : "bg-panel",
                      estado === "hecha" ? "" : estado === "ahora" ? "border-marca text-marca ring-4 ring-marca/20" : "border-line text-faint")}>
                      {estado === "hecha" ? "✓" : i + 1}
                    </span>
                    <div className="min-w-0 flex-1 sm:w-full sm:flex-none sm:px-1">
                      <p className={cx("text-sm", estado === "ahora" ? "font-bold" : "font-semibold text-muted")}>{nombre}</p>
                      {notas.map((o) => (
                        <div key={o.id} className={cx("mt-2 rounded-xl border px-2.5 py-1.5 text-left text-[12.5px] leading-snug", estado === "ahora" ? "border-marca/35 bg-sun-50" : "border-line bg-soft")}>
                          <span className="block">{o.texto}</span>
                          <small className="mt-0.5 block text-[11px] text-faint">INER · {fechaHora(o.created_at)}</small>
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-5 rounded-xl bg-sun-50 px-4 py-3">
              <p className="font-bold">Ahora: {FASES[f]}</p>
              <p className="text-sm text-muted">{DETALLE[f]}{faltan > 0 && ` Te ${faltan === 1 ? "falta 1 documento" : `faltan ${faltan} documentos`} por enviar.`}</p>
            </div>
          </section>
          <DocsCliente docs={mios} />
        </div>

        <aside className="space-y-5">
          <section className="tarjeta p-5">
            <p className="etiqueta">Lo que vas a cobrar</p>
            <p className="num mt-1 text-4xl leading-tight">{eur(importe)}</p>
            {cli.mwh != null
              ? <p className="text-sm text-muted">{num(cli.mwh)} MWh × {num(cli.precio_mwh)} €/MWh</p>
              : <p className="text-sm text-muted">Todavía estamos calculando los MWh de tu actuación.</p>}
            <p className="mt-3">
              {cli.cobrado_at
                ? <span className="rounded-full bg-batt-50 px-2.5 py-0.5 text-xs font-bold text-batt-700">Pagado el {fecha(cli.cobrado_at)}</span>
                : f === 4 ? <span className="rounded-full bg-sun-50 px-2.5 py-0.5 text-xs font-bold text-sun-700">Pendiente de pago por INER</span>
                : <span className="rounded-full bg-net-50 px-2.5 py-0.5 text-xs font-bold text-net-700">Se paga cuando el CAE esté expedido</span>}
            </p>
            <p className="mt-2 text-sm text-muted">Te lo paga INER. Aquí verás cuándo esté pagado.</p>
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
