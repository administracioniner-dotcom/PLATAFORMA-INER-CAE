import { Perfil } from "@/components/vistas/Perfil";
import { requireCliente } from "@/lib/auth";

export default async function PerfilCliente() {
  const { profile } = await requireCliente();
  return <Perfil nombre={profile.nombre} email={profile.email} rol="Cliente" desde={profile.created_at} puedeEditarNombre={false} />;
}
