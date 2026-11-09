import { Cabecera } from "@/components/Cabecera";
import { Pie } from "@/components/Pie";
import { requireCliente } from "@/lib/auth";

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireCliente();
  return (
    <div className="flex min-h-screen flex-col">
      <Cabecera nombre={profile.nombre ?? profile.email} rol="Cliente" enlaces={[{ href: "/cliente", texto: "Mi proyecto" }, { href: "/cliente/perfil", texto: "Mi perfil" }, { href: "/cliente/soporte", texto: "Soporte" }]} />
      <main className="contenedor w-full flex-1 py-6">{children}</main>
      <Pie />
    </div>
  );
}
