import { redirect } from "next/navigation";
import { borrarInvitacion, cambiarEstadoCuenta, cambiarNombreDeCuenta, crearCuenta, eliminarCuenta, restablecerContrasena } from "@/app/actions";
import { CampoContrasena } from "@/components/CampoContrasena";
import { FormEstado } from "@/components/FormEstado";
import { Submit } from "@/components/Submit";
import { requireStaff } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { fecha } from "@/lib/utils";

const ROLES: Record<string, string> = { colaborador: "Colaborador", admin: "Administrador" };
// Los clientes se crean desde «Mis clientes»; aquí solo aparecen en la lista de cuentas.
const GRUPOS: [string, string][] = [["admin", "Administradores"], ["colaborador", "Colaboradores"], ["cliente", "Clientes"]];
const ETIQUETA_ROL: Record<string, string> = { ...ROLES, delegado: "Administrador", cliente: "Cliente" };

export default async function Invitar() {
  const { supabase, profile } = await requireStaff();
  if (profile.rol !== "admin") redirect("/equipo");
  const { data: personas } = await supabase.from("profiles").select("id,nombre,email,rol,estado,created_at").order("created_at");
  const { data: inv } = await supabase.from("invitaciones").select("email,rol,nombre,created_at");
  const { data: cl } = await supabase.from("clientes").select("colaborador_id,pago");
  const total = new Map<string, number>(), pagados = new Map<string, number>();
  for (const c of cl ?? []) {
    total.set(c.colaborador_id, (total.get(c.colaborador_id) ?? 0) + 1);
    if (c.pago === "paid") pagados.set(c.colaborador_id, (pagados.get(c.colaborador_id) ?? 0) + 1);
  }
  // Solo el servidor sabe qué cuentas están desactivadas (campo de Supabase Auth).
  const { data: usuarios } = await createServiceClient().auth.admin.listUsers({ perPage: 200 });
  const desactivadas = new Set((usuarios?.users ?? []).filter((u) => u.banned_until && new Date(u.banned_until).getTime() > Date.now()).map((u) => u.id));
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
          <div className="space-y-3">
          {GRUPOS.map(([rol, titulo]) => {
            const delGrupo = (personas ?? []).filter((x) => x.rol === rol || (rol === "admin" && x.rol === "delegado"));
            return (
          <details key={rol} open={rol !== "cliente"} className="tarjeta">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-bold">
              <span>{titulo}</span><span className="rounded-full bg-soft px-2.5 py-0.5 text-xs text-muted">{delGrupo.length}</span>
            </summary>
          <ul className="divide-y divide-line border-t border-line">
            {delGrupo.length === 0 && <li className="px-4 py-3 text-sm text-muted">Ninguna cuenta.</li>}
            {delGrupo.map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span><span className="font-semibold">{p.nombre ?? p.email}</span> <span className="text-muted">{p.email}</span></span>
                  <span className="text-muted">{ETIQUETA_ROL[p.rol]} · {desactivadas.has(p.id) ? <span className="font-semibold text-red-700">Desactivado</span> : p.estado === "activo" ? "Activo" : "Aún no ha entrado"}</span>
                </div>
                <details className="mt-2">
                  <summary className="w-fit cursor-pointer text-xs font-semibold text-net-700 underline underline-offset-2">Gestionar cuenta</summary>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <FormEstado action={cambiarNombreDeCuenta} className="space-y-2 rounded-xl bg-soft p-4">
                      <input type="hidden" name="id" value={p.id} />
                      <label className="text-sm font-bold" htmlFor={`nombre-${p.id}`}>Cambiar nombre <span className="font-normal text-muted">· el que se muestra y con el que se le paga</span></label>
                      <div className="flex gap-2">
                        <input id={`nombre-${p.id}`} name="nombre" required maxLength={120} defaultValue={p.nombre ?? ""} className="input !bg-panel !py-1.5" />
                        <Submit className="btn-primary shrink-0 !px-4 !py-1.5" pendiente="Guardando…">Guardar</Submit>
                      </div>
                    </FormEstado>
                    <FormEstado action={restablecerContrasena} className="space-y-2 rounded-xl bg-soft p-4">
                      <input type="hidden" name="colaborador_id" value={p.id} />
                      <p className="text-sm font-bold">Cambiar contraseña <span className="font-normal text-muted">· cópiala antes de guardar: no se vuelve a mostrar</span></p>
                      <div className="flex gap-2">
                        <div className="min-w-0 flex-1"><CampoContrasena id={`pw-${p.id}`} compacto /></div>
                        <Submit className="btn-primary shrink-0 !px-4 !py-1.5" pendiente="Guardando…">Guardar</Submit>
                      </div>
                    </FormEstado>
                  </div>
                  {p.id !== profile.id && (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <FormEstado action={cambiarEstadoCuenta} className="space-y-2 rounded-xl bg-soft p-4">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="accion" value={desactivadas.has(p.id) ? "reactivar" : "desactivar"} />
                        <p className="text-sm font-bold">{desactivadas.has(p.id) ? "Reactivar cuenta" : "Desactivar cuenta"} <span className="font-normal text-muted">· {desactivadas.has(p.id) ? "vuelve a poder entrar" : "no podrá entrar; se conservan sus clientes, pagos y mensajes"}</span></p>
                        <Submit className="btn-primary !px-4 !py-1.5" pendiente="Guardando…">{desactivadas.has(p.id) ? "Reactivar" : "Desactivar"}</Submit>
                      </FormEstado>
                      <FormEstado action={eliminarCuenta} className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
                        <input type="hidden" name="id" value={p.id} />
                        <p className="text-sm font-bold text-red-800">Eliminar para siempre</p>
                        <p className="text-xs text-red-800">Se borran la cuenta, sus {total.get(p.id) ?? 0} clientes{(pagados.get(p.id) ?? 0) > 0 ? ` (${pagados.get(p.id)} ya pagados: se pierde ese historial)` : ""} y todos sus mensajes. No se puede deshacer. Si dudas, desactívala.</p>
                        <label className="text-xs font-semibold text-red-800" htmlFor={`conf-${p.id}`}>Escribe <span className="select-all">{p.email}</span> para confirmar</label>
                        <div className="flex gap-2">
                          <input id={`conf-${p.id}`} name="confirmar" required autoComplete="off" className="input !bg-panel !py-1.5" />
                          <Submit className="shrink-0 rounded-full bg-red-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-800" pendiente="Eliminando…">Eliminar</Submit>
                        </div>
                      </FormEstado>
                    </div>
                  )}
                </details>
              </li>
            ))}
          </ul>
          </details>
            );
          })}
          </div>
        </section>
        {pendientes.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold">Invitaciones sin usar</h2>
            <ul className="divide-y divide-line tarjeta">
              {pendientes.map((i) => (
                <li key={i.email} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span>{i.nombre ?? i.email} <span className="text-muted">{i.email}</span></span>
                  <span className="flex items-center gap-3 text-muted">
                    {ETIQUETA_ROL[i.rol]} · {fecha(i.created_at)}
                    <FormEstado action={borrarInvitacion}>
                      <input type="hidden" name="email" value={i.email} />
                      <Submit className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50" pendiente="Borrando…">Borrar</Submit>
                    </FormEstado>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
