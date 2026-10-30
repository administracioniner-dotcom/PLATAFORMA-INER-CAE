import { redirect } from "next/navigation";
import { crearCuenta, restablecerContrasena } from "@/app/actions";
import { CampoContrasena } from "@/components/CampoContrasena";
import { FormEstado } from "@/components/FormEstado";
import { Submit } from "@/components/Submit";
import { requireStaff } from "@/lib/auth";
import { fecha } from "@/lib/utils";

const ROLES: Record<string, string> = { colaborador: "Colaborador", delegado: "Delegado", admin: "Administrador" };

export default async function Invitar() {
  const { supabase, profile } = await requireStaff();
  if (profile.rol !== "admin") redirect("/equipo");
  const { data: personas } = await supabase.from("profiles").select("id,nombre,email,rol,estado,created_at").order("created_at");
  const { data: inv } = await supabase.from("invitaciones").select("email,rol,nombre,created_at");
  const registrados = new Set((personas ?? []).map((p) => p.email));
  const pendientes = (inv ?? []).filter((i) => !registrados.has(i.email));
  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
      <div className="h-fit space-y-6">
        <FormEstado action={crearCuenta} className="space-y-4 tarjeta p-6">
          <h1 className="text-2xl font-bold tracking-[-0.02em]">Crear colaborador</h1>
          <p className="text-sm text-muted">Pones tú el correo y la contraseña. La persona entra directamente con ellos, sin esperar ningún correo.</p>
          <div><label className="label" htmlFor="c-nombre">Nombre</label><input id="c-nombre" name="nombre" className="input" /></div>
          <div><label className="label" htmlFor="c-email">Correo</label><input id="c-email" name="email" type="email" required className="input" /></div>
          <CampoContrasena />
          <div><label className="label" htmlFor="c-rol">Rol</label>
            <select id="c-rol" name="rol" className="input" defaultValue="colaborador">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </div>
          <Submit className="btn-primary w-full" pendiente="Creando…">Crear cuenta</Submit>
        </FormEstado>
      </div>
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-lg font-bold">Cuentas</h2>
          <ul className="divide-y divide-line tarjeta">
            {(personas ?? []).map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span><span className="font-semibold">{p.nombre ?? p.email}</span> <span className="text-muted">{p.email}</span></span>
                  <span className="text-muted">{ROLES[p.rol]} · {p.estado === "activo" ? "Activo" : "Aún no ha entrado"}</span>
                </div>
                <details className="mt-2">
                  <summary className="w-fit cursor-pointer text-xs font-semibold text-net-700 underline underline-offset-2">Cambiar contraseña</summary>
                  <FormEstado action={restablecerContrasena} className="mt-3 max-w-md space-y-3">
                    <input type="hidden" name="colaborador_id" value={p.id} />
                    <CampoContrasena id={`pw-${p.id}`} />
                    <Submit className="btn-primary !py-1.5" pendiente="Guardando…">Guardar contraseña</Submit>
                  </FormEstado>
                </details>
              </li>
            ))}
          </ul>
        </section>
        {pendientes.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold">Invitaciones sin usar</h2>
            <ul className="divide-y divide-line tarjeta">
              {pendientes.map((i) => <li key={i.email} className="flex justify-between gap-2 px-4 py-3 text-sm"><span>{i.nombre ?? i.email} <span className="text-muted">{i.email}</span></span><span className="text-muted">{ROLES[i.rol]} · {fecha(i.created_at)}</span></li>)}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
