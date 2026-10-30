import { Cabecera } from "@/components/Cabecera";
import { Pie } from "@/components/Pie";
import { requireStaff } from "@/lib/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireStaff();
  const { count } = await supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("leido", false).eq("remitente", "colaborador");
  const enlaces = [
    { href: "/equipo", texto: "Colaboradores" },
    { href: "/equipo/mensajes", texto: "Mensajes", badge: count ?? 0 },
    ...(profile.rol === "admin" ? [{ href: "/equipo/invitar", texto: "Crear colaborador" }] : []),
    { href: "/equipo/perfil", texto: "Mi perfil" },
  ];
  return (
    <>
      <Cabecera nombre={profile.nombre ?? profile.email} rol={profile.rol === "admin" ? "Administrador" : "Delegado"} enlaces={enlaces} />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <Pie />
    </>
  );
}
