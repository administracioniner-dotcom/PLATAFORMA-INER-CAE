/** Círculo con las iniciales de una persona o cliente. */
export function Iniciales({ texto, color, pequeno = false }: { texto: string; color: string; pequeno?: boolean }) {
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${pequeno ? "h-7 w-7 text-[11px]" : "h-10 w-10 text-sm"}`} style={{ background: color }}>{texto}</span>
  );
}
