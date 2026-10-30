import { Perfil } from "@/components/vistas/Perfil";
import { requireStaff } from "@/lib/auth";

export default async function MiPerfilEquipo() {
  const { profile } = await requireStaff();
  return <Perfil nombre={profile.nombre} email={profile.email} rol={profile.rol === "admin" ? "Administrador" : "Delegado"} desde={profile.created_at} />;
}
