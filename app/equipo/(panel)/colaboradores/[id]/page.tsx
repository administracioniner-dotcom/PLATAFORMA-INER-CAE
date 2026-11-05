import { notFound } from "next/navigation";
import { TableroCliente } from "@/components/vistas/TableroCliente";
import { AutoRefresh } from "@/components/AutoRefresh";
import { requireStaff } from "@/lib/auth";
import type { ClienteStaff, Profile } from "@/lib/types";

export default async function ColaboradorDetalle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ archivados?: string }> }) {
  const { id } = await params;
  const verArchivados = (await searchParams).archivados === "1";
  const { supabase, profile } = await requireStaff();
  const [{ data: p }, { data }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).eq("rol", "colaborador").single(),
    supabase.from("clientes").select("*").eq("colaborador_id", id).order("created_at"),
  ]);
  if (!p) notFound();
  return (
    <>
      <AutoRefresh cada={30} />
      <TableroCliente col={p as Profile} clientes={(data ?? []) as ClienteStaff[]} verArchivados={verArchivados} esAdmin={profile.rol === "admin"} />
    </>
  );
}
