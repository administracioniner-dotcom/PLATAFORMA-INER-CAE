import { Cabecera } from "@/components/Cabecera";
import { Pie } from "@/components/Pie";
import { requireColaborador } from "@/lib/auth";

export default async function ColabLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireColaborador();
  const { count } = await supabase.from("mensajes").select("id", { count: "exact", head: true })
    .eq("colaborador_id", user!.id).eq("leido", false).neq("remitente", "colaborador");
  return (
    <>
      <Cabecera nombre={profile.nombre ?? profile.email} rol="Colaborador" enlaces={[{ href: "/", texto: "Panel" }, { href: "/mensajes", texto: "Mensajes", badge: count ?? 0 }, { href: "/perfil", texto: "Mi perfil" }, { href: "/soporte", texto: "Soporte" }]} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <Pie />
    </>
  );
}
