import { PanelColaborador } from "@/components/vistas/PanelColaborador";
import { AutoRefresh } from "@/components/AutoRefresh";
import { requireColaborador } from "@/lib/auth";
import type { ClienteColab } from "@/lib/types";

export default async function Panel({ searchParams }: { searchParams: Promise<{ archivados?: string }> }) {
  const { archivados } = await searchParams;
  const { supabase, profile } = await requireColaborador();
  const { data } = await supabase.from("mis_clientes").select("*").order("created_at", { ascending: false });
  return (
    <>
      <AutoRefresh cada={30} />
      <PanelColaborador nombre={profile.nombre ?? profile.email} clientes={(data ?? []) as ClienteColab[]} verArchivados={archivados === "1"} />
    </>
  );
}
