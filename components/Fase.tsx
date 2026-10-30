import { FASES, FASE_COLOR, cx } from "@/lib/utils";

/** Etiqueta con el nombre de la fase. */
export function Fase({ fase }: { fase: number }) {
  const hecho = fase === 4;
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", hecho ? "bg-batt-50 text-batt-700" : "bg-net-50 text-net-700")}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: FASE_COLOR[fase] }} />{FASES[fase]}
    </span>
  );
}

/** Cinco tramos: los alcanzados toman el color de su fase. */
export function Recorrido({ fase }: { fase: number }) {
  return (
    <div className="min-w-[8.5rem]" role="img" aria-label={`Fase ${fase + 1} de 5: ${FASES[fase]}`}>
      <div className="flex gap-1" aria-hidden>
        {FASES.map((_, i) => <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i <= fase ? FASE_COLOR[i] : "#E5E7EB" }} />)}
      </div>
      <p className={cx("mt-1.5 text-xs font-semibold", fase === 4 ? "text-batt-700" : "text-ink")}>{FASES[fase]}</p>
    </div>
  );
}

/** Reparto de clientes por fase en una sola barra; cada tramo crece al cargar. */
export function Embudo({ conteos, compacto = false }: { conteos: number[]; compacto?: boolean }) {
  const total = conteos.reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className={cx("flex gap-1 overflow-hidden rounded-full bg-soft", compacto ? "h-1.5" : "h-3.5")} role="img"
        aria-label={total ? FASES.map((f, i) => `${f}: ${conteos[i]}`).join(", ") : "Sin clientes"}>
        {total > 0 && conteos.map((n, i) => n > 0 && (
          <span key={i} className="tramo h-full rounded-full" style={{ flexGrow: n, background: FASE_COLOR[i], ["--i" as string]: i }} />
        ))}
      </div>
      {!compacto && (
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
          {FASES.map((f, i) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: FASE_COLOR[i] }} />
              <span className="leading-tight"><span className="num block text-xl">{conteos[i]}</span><span className="text-xs text-muted">{f}</span></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Tarjeta de indicador. `marca` la destaca en azul marino (cifra principal del panel). */
export function Kpi({ etiqueta, valor, nota, tono = "ink", accion }: { etiqueta: string; valor: string; nota?: string; tono?: "ink" | "sun" | "batt" | "net" | "marca"; accion?: { href: string; texto: string } }) {
  const marca = tono === "marca";
  const color = { ink: "text-ink", sun: "text-sun-700", batt: "text-batt-700", net: "text-net-700", marca: "text-white" }[tono];
  return (
    <div className={cx("flex flex-col rounded-[18px] p-5 shadow-card", marca ? "justify-between bg-ink p-6 sm:p-8" : "border border-line bg-panel")}>
      <div>
        <p className={cx("etiqueta", marca && "!text-white/75")}>{etiqueta}</p>
        <p className={cx("num mt-2 text-3xl", color, marca && "text-5xl sm:text-6xl")}>{valor}</p>
        {nota && <p className={cx("mt-1", marca ? "mt-3 max-w-xs text-sm text-white/85" : "text-xs text-muted")}>{nota}</p>}
      </div>
      {accion && <a href={accion.href} className="btn btn-primary flecha mt-6 self-start">{accion.texto}</a>}
    </div>
  );
}

/** Franja de cifras separadas por líneas verticales, como en iner.es. */
export function KpiFila({ items }: { items: { etiqueta: string; valor: string; nota?: string; tono?: "ink" | "sun" | "batt" | "net" }[] }) {
  return (
    <dl className="tarjeta grid grid-cols-1 divide-y divide-line sm:grid-flow-col sm:auto-cols-fr sm:divide-x sm:divide-y-0">
      {items.map((k) => (
        <div key={k.etiqueta} className="px-6 py-5">
          <dt className="etiqueta">{k.etiqueta}</dt>
          <dd className={cx("num mt-1 text-3xl", { ink: "text-ink", sun: "text-sun-700", batt: "text-batt-700", net: "text-net-700" }[k.tono ?? "ink"])}>{k.valor}</dd>
          {k.nota && <p className="mt-0.5 text-xs text-muted">{k.nota}</p>}
        </div>
      ))}
    </dl>
  );
}
