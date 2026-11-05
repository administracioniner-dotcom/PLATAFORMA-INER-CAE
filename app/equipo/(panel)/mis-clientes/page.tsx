import { MisClientes } from "@/components/vistas/MisClientes";
import { requireStaff } from "@/lib/auth";
import type { ClienteDirecto, FichaDoc, FichaTipo, MarcaDoc } from "@/lib/types";

export default async function MisClientesPagina() {
  const { supabase, profile } = await requireStaff();
  const [{ data: fichas }, { data: docs }, { data: clientes }, { data: marcas }] = await Promise.all([
    supabase.from("fichas_tipo").select("id,codigo,nombre").order("codigo"),
    supabase.from("fichas_documento").select("id,ficha_id,grupo,nombre,ayuda,depende_de,aviso_anios,orden").order("orden"),
    supabase.from("clientes_directos").select("id,nombre,ficha_id,mwh,precio_mwh,fase,cobrado_at,created_at").order("created_at", { ascending: false }),
    supabase.from("clientes_directos_docs").select("cliente_id,documento_id,listo,fecha"),
  ]);
  return (
    <MisClientes fichas={(fichas ?? []) as FichaTipo[]} docs={(docs ?? []) as FichaDoc[]} clientes={(clientes ?? []) as ClienteDirecto[]}
      marcas={(marcas ?? []) as MarcaDoc[]} esAdmin={profile.rol === "admin"} />
  );
}
