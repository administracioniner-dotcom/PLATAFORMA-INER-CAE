import Link from "next/link";
import { redirect } from "next/navigation";
import { cerrarSesion } from "@/app/actions";
import { DosPasos } from "@/components/DosPasos";
import { Marca } from "@/components/Marca";
import { dosPasosObligatorio, tieneDosPasos } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Fuera del panel a propósito: el panel exige el segundo factor, y esta página es la que permite completarlo.
export default async function DosPasosPagina() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/equipo/login");
  const { data: p } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  if (p?.rol !== "admin") redirect("/equipo");
  const { data: c } = await supabase.auth.getClaims();
  const aal2 = (c?.claims as { aal?: string } | undefined)?.aal === "aal2";
  const activa = tieneDosPasos(user);
  const obligatorio = dosPasosObligatorio();
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="tarjeta w-full max-w-md space-y-5 p-7">
        <Marca className="h-10" />
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em]">Verificación en dos pasos</h1>
          <p className="mt-1 text-sm text-muted">
            {activa && aal2 ? "Está activada en tu cuenta." : activa ? "Un paso más para entrar." : obligatorio ? "Para entrar al panel hay que activarla. Solo se hace una vez." : "Añade una capa más: además de la contraseña, un código de tu móvil."}
          </p>
        </div>
        {activa && aal2
          ? <Link href="/equipo" className="btn-primary flecha inline-flex">Ir al panel</Link>
          : <DosPasos modo={activa ? "pedir" : "activar"} />}
        <div className="flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
          {!activa && !obligatorio ? <Link href="/equipo/perfil" className="font-semibold text-net-700 underline underline-offset-2">Ahora no</Link> : <span />}
          <form action={cerrarSesion}><button className="font-semibold text-muted underline underline-offset-2">Salir</button></form>
        </div>
      </div>
    </main>
  );
}
