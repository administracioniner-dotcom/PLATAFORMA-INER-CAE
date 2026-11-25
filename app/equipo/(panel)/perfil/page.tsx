import Link from "next/link";
import { Perfil } from "@/components/vistas/Perfil";
import { requireStaff, tieneDosPasos } from "@/lib/auth";

export default async function MiPerfilEquipo() {
  const { profile, user } = await requireStaff();
  const activa = !!user && tieneDosPasos(user);
  return (
    <>
      <Perfil nombre={profile.nombre} email={profile.email} rol="Administrador" desde={profile.created_at} puedeEditarNombre />
      <section className="tarjeta mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">Verificación en dos pasos</h2>
          <p className="text-sm text-muted">{activa ? "Activada: al entrar te pedimos también el código de tu aplicación." : "Desactivada. Además de la contraseña, pide un código de tu móvil."}</p>
        </div>
        {activa
          ? <span className="rounded-full bg-batt-50 px-3 py-1 text-sm font-bold text-batt-700">✓ Activada</span>
          : <Link href="/equipo/2fa" className="btn-primary">Activar ahora</Link>}
      </section>
    </>
  );
}
