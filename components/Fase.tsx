import { FASES, cx } from "@/lib/utils";
const color = ["bg-navy-100 text-navy", "bg-navy-100 text-navy", "bg-ambar-50 text-[#8a5a00]", "bg-ambar-50 text-[#8a5a00]", "bg-verde-50 text-[#0b7a4d]"];
export function Fase({ fase }: { fase: number }) {
  return <span className={cx("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", color[fase])}>{FASES[fase]}</span>;
}
export function Pasos({ fase }: { fase: number }) {
  return (
    <div className="flex gap-1" aria-label={`Fase ${fase + 1} de 5: ${FASES[fase]}`}>
      {FASES.map((_, i) => <span key={i} className={cx("h-1.5 w-6 rounded-full", i <= fase ? "bg-verde" : "bg-navy/15")} />)}
    </div>
  );
}

/** Puntos de progreso: verde = fase superada, ámbar = fase actual, gris = pendiente. */
export function Puntos({ fase }: { fase: number }) {
  return (
    <div className="flex flex-col gap-1.5" role="img" aria-label={`Fase ${fase + 1} de 5: ${FASES[fase]}`}>
      <div className="flex gap-1" aria-hidden>
        {FASES.map((_, i) => <span key={i} className={cx("h-2 w-2 rounded-full", i < fase || fase === 4 ? "bg-verde" : i === fase ? "bg-ambar" : "bg-navy/15")} />)}
      </div>
      <span className={cx("text-xs font-semibold", fase === 4 ? "text-verde" : "text-navy/80")}>{FASES[fase]}</span>
    </div>
  );
}
