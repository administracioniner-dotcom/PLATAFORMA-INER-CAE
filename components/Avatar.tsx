import { iniciales } from "@/lib/utils";

export function Avatar({ nombre, tamano = "md" }: { nombre: string; tamano?: "sm" | "md" | "lg" }) {
  const t = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-xl" }[tamano];
  return <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-ink font-bold text-white ${t}`}>{iniciales(nombre)}</span>;
}
