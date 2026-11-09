import { redirect } from "next/navigation";
import { FichasVista } from "@/components/vistas/FichasVista";
import { requireStaff } from "@/lib/auth";
import type { FichaDoc, FichaTipo } from "@/lib/types";

export default async function Fichas() {
  const { supabase, profile } = await requireStaff();
  if (profile.rol !== "admin") redirect("/equipo/mis-clientes");
  const [{ data: fs }, { data: ds }, { data: cs }] = await Promise.all([
    supabase.from("fichas_tipo").select("id,codigo,nombre").order("codigo"),
    supabase.from("fichas_documento").select("id,ficha_id,grupo,nombre,ayuda,depende_de,aviso_anios,orden,aporta").order("orden"),
    supabase.from("clientes_directos").select("ficha_id"),
  ]);
  const usos: Record<string, number> = {};
  for (const c of cs ?? []) usos[c.ficha_id] = (usos[c.ficha_id] ?? 0) + 1;
  return <FichasVista fichas={(fs ?? []) as FichaTipo[]} docs={(ds ?? []) as FichaDoc[]} usos={usos} />;
}
