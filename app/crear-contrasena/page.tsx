import { redirect } from "next/navigation";
import { guardarContrasena } from "@/app/actions";
import { FormEstado } from "@/components/FormEstado";
import { Submit } from "@/components/Submit";
import { Marca } from "@/components/Marca";
import { createClient } from "@/lib/supabase/server";

export default async function CrearContrasena() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/recuperar?caducado=1");
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <FormEstado action={guardarContrasena} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-navy/10">
        <Marca />
        <h1 className="text-xl font-bold">Elige tu contraseña</h1>
        <p className="text-sm text-navy/70">Será la que uses para entrar al portal. Mínimo 10 caracteres.</p>
        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password2">Repítela</label>
          <input id="password2" name="password2" type="password" autoComplete="new-password" minLength={10} required className="input" />
        </div>
        <Submit className="btn-verde w-full" pendiente="Guardando…">Guardar y entrar</Submit>
      </FormEstado>
    </main>
  );
}
