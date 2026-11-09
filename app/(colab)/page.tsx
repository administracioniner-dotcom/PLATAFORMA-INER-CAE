import { PanelColaborador } from "@/components/vistas/PanelColaborador";
import { AutoRefresh } from "@/components/AutoRefresh";
import { requireColaborador } from "@/lib/auth";
import type { Cambio, ClienteColab } from "@/lib/types";

export default async function Panel({ searchParams }: { searchParams: Promise<{ archivados?: string }> }) {
  const { archivados } = await searchParams;
  const { supabase, profile } = await requireColaborador();
  const [{ data }, { count: sinLeer }, { data: hist }] = await Promise.all([
    supabase.from("mis_clientes").select("*").order("created_at", { ascending: false }),
    supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("colaborador_id", profile.id).eq("leido", false).neq("remitente", "colaborador"),
    supabase.rpc("mis_historial"),
  ]);
  return (
    <>
      <AutoRefresh cada={60} />
      <PanelColaborador nombre={profile.nombre ?? profile.email} clientes={(data ?? []) as ClienteColab[]} verArchivados={archivados === "1"} sinLeer={sinLeer ?? 0} historial={(hist ?? []) as Cambio[]} />
    </>
  );
}
