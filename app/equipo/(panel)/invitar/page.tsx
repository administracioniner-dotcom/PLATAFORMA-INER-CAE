import { redirect } from "next/navigation";
import { crearCuenta, invitar } from "@/app/actions";
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
        <FormEstado action={crearCuenta} className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-navy/10">
          <h1 className="text-xl font-bold">Crear colaborador</h1>
          <p className="text-sm text-navy/70">Creas el correo y la contraseña aquí mismo. La persona entra directamente, sin esperar ningún correo.</p>
          <div><label className="label" htmlFor="c-nombre">Nombre</label><input id="c-nombre" name="nombre" className="input" /></div>
          <div><label className="label" htmlFor="c-email">Correo</label><input id="c-email" name="email" type="email" required className="input" /></div>
          <CampoContrasena />
          <div><label className="label" htmlFor="c-rol">Rol</label>
            <select id="c-rol" name="rol" className="input" defaultValue="colaborador">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </div>
          <Submit className="btn-verde w-full" pendiente="Creando…">Crear cuenta</Submit>
        </FormEstado>
        <FormEstado action={invitar} className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-navy/10">
          <h2 className="text-lg font-bold">Invitar por correo</h2>
          <p className="text-sm text-navy/70">Alternativa: le llega un enlace para que elija su propia contraseña.</p>
          <div><label className="label" htmlFor="nombre">Nombre</label><input id="nombre" name="nombre" className="input" /></div>
          <div><label className="label" htmlFor="email">Correo</label><input id="email" name="email" type="email" required className="input" /></div>
          <div><label className="label" htmlFor="rol">Rol</label>
            <select id="rol" name="rol" className="input" defaultValue="colaborador">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </div>
          <Submit className="btn-primary w-full" pendiente="Enviando…">Enviar invitación</Submit>
        </FormEstado>
      </div>
      <div className="space-y-6">
        <section>
          <h2 className="mb-2 text-lg font-bold">Cuentas</h2>
          <ul className="divide-y divide-navy/10 rounded-2xl bg-white ring-1 ring-navy/10">
            {(personas ?? []).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span><span className="font-semibold">{p.nombre ?? p.email}</span> <span className="text-navy/60">{p.email}</span></span>
                <span className="text-navy/70">{ROLES[p.rol]} · {p.estado === "activo" ? "Activo" : "Aún no ha entrado"}</span>
              </li>
            ))}
          </ul>
        </section>
        {pendientes.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-bold">Invitaciones sin usar</h2>
            <ul className="divide-y divide-navy/10 rounded-2xl bg-white ring-1 ring-navy/10">
              {pendientes.map((i) => <li key={i.email} className="flex justify-between gap-2 px-4 py-3 text-sm"><span>{i.nombre ?? i.email} <span className="text-navy/60">{i.email}</span></span><span className="text-navy/70">{ROLES[i.rol]} · {fecha(i.created_at)}</span></li>)}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
