import { Cabecera } from "@/components/Cabecera";
import { Pie } from "@/components/Pie";
import { requireStaff } from "@/lib/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireStaff();
  const { count } = await supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("leido", false).eq("remitente", "colaborador");
  const enlaces = [
    { href: "/equipo", texto: "Colaboradores" },
    { href: "/equipo/mensajes", texto: "Mensajes", badge: count ?? 0 },
    { href: "/equipo/mis-clientes", texto: "Mis clientes" },
    ...(profile.rol === "admin" ? [{ href: "/equipo/invitar", texto: "Crear colaborador" }] : []),
    { href: "/equipo/perfil", texto: "Mi perfil" },
  ];
  return (
    // Columna que ocupa al menos toda la ventana: en páginas cortas el pie baja hasta el final en lugar de quedarse a media altura.
    <div className="flex min-h-screen flex-col">
      <Cabecera nombre={profile.nombre ?? profile.email} rol="Administrador" enlaces={enlaces} />
      <main className="contenedor w-full flex-1 py-8">{children}</main>
      <Pie />
    </div>
  );
}
