import { iniciales } from "@/lib/utils";

export function Avatar({ nombre, tamano = "md" }: { nombre: string; tamano?: "sm" | "md" | "lg" }) {
  const t = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-xl" }[tamano];
  return <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-brand font-black text-ink ${t}`}>{iniciales(nombre)}</span>;
}
