"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export type Estado = { error?: string; ok?: string } | undefined;

/* ---------- Acceso ---------- */
export async function iniciarSesion(_: Estado, fd: FormData): Promise<Estado> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Correo o contraseña incorrectos." };
  // El rol lo decide el servidor según la cuenta, no la URL por la que entró.
  const { profile } = await getSessionProfile();
  if (!profile) {
    await supabase.auth.signOut();
    return { error: "Tu cuenta no está activa. Pide una invitación a INER." };
  }
  redirect(profile.rol === "colaborador" ? "/" : "/equipo");
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function recuperar(_: Estado, fd: FormData): Promise<Estado> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Escribe tu correo." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE()}/auth/confirm?next=/crear-contrasena` });
  // Misma respuesta exista o no la cuenta.
  return { ok: "Si el correo está registrado, te hemos enviado un enlace para crear una contraseña nueva." };
}

export async function guardarContrasena(_: Estado, fd: FormData): Promise<Estado> {
  const p1 = String(fd.get("password") ?? "");
  const p2 = String(fd.get("password2") ?? "");
  if (p1.length < 10) return { error: "Usa al menos 10 caracteres." };
  if (p1 !== p2) return { error: "Las dos contraseñas no coinciden." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "El enlace ha caducado. Pide uno nuevo." };
  const { error } = await supabase.auth.updateUser({ password: p1 });
  if (error) return { error: "No se pudo guardar la contraseña. Prueba con otra." };
  const { profile } = await getSessionProfile();
  redirect(profile && profile.rol !== "colaborador" ? "/equipo" : "/");
}

/* ---------- Colaborador ---------- */
export async function solicitarPago(fd: FormData) {
  const supabase = await createClient();
  await supabase.rpc("solicitar_pago", { p_cliente: String(fd.get("id")) });
  revalidatePath("/");
}

/* ---------- Mensajes (colaborador y equipo) ---------- */
export async function enviarMensaje(fd: FormData) {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) return;
  const texto = String(fd.get("texto") ?? "").trim();
  if (!texto) return;
  const clienteId = String(fd.get("cliente_id") ?? "") || null;
  const colaboradorId = profile.rol === "colaborador" ? user.id : String(fd.get("colaborador_id"));
  await supabase.from("mensajes").insert({
    colaborador_id: colaboradorId,
    cliente_id: clienteId,
    texto,
    autor: user.id,
    remitente: profile.rol === "colaborador" ? "colaborador" : "delegado",
    es_sistema: false,
  });
  revalidatePath("/mensajes");
  revalidatePath("/equipo/mensajes");
}

/* ---------- Equipo (delegado / admin) ---------- */
async function soloStaff() {
  const s = await getSessionProfile();
  if (!s.profile || s.profile.rol === "colaborador") throw new Error("No autorizado");
  return s;
}

export async function crearCliente(_: Estado, fd: FormData): Promise<Estado> {
  const { supabase } = await soloStaff();
  const nombre = String(fd.get("nombre") ?? "").trim();
  const colaboradorId = String(fd.get("colaborador_id") ?? "");
  if (!nombre) return { error: "Escribe el nombre del cliente." };
  if (!colaboradorId) return { error: "Falta el colaborador." };
  const { error } = await supabase.from("clientes").insert({ colaborador_id: colaboradorId, nombre });
  if (error) return { error: "No se pudo añadir el cliente." };
  revalidatePath(`/equipo/colaboradores/${colaboradorId}`);
  return { ok: "Cliente añadido." };
}

export async function moverFase(fd: FormData) {
  const { supabase } = await soloStaff();
  const id = String(fd.get("id"));
  const delta = Number(fd.get("delta"));
  const { data } = await supabase.from("clientes").select("fase,colaborador_id").eq("id", id).single();
  if (!data) return;
  const nueva = Math.min(4, Math.max(0, data.fase + delta));
  if (nueva !== data.fase) await supabase.from("clientes").update({ fase: nueva }).eq("id", id);
  revalidatePath(`/equipo/colaboradores/${data.colaborador_id}`);
}

export async function guardarMwh(fd: FormData) {
  const { supabase } = await soloStaff();
  const id = String(fd.get("id"));
  const v = String(fd.get("mwh") ?? "").replace(",", ".").trim();
  const mwh = v === "" ? null : Number(v);
  if (mwh !== null && (Number.isNaN(mwh) || mwh < 0)) return;
  const { data } = await supabase.from("clientes").update({ mwh }).eq("id", id).select("colaborador_id").single();
  if (data) revalidatePath(`/equipo/colaboradores/${data.colaborador_id}`);
}

export async function guardarPct(fd: FormData) {
  const { supabase } = await soloStaff();
  const id = String(fd.get("id"));
  const pct = Number(String(fd.get("pct")).replace(",", "."));
  if (Number.isNaN(pct) || pct < 0 || pct > 100) return;
  const { data } = await supabase.from("clientes").update({ pct }).eq("id", id).select("colaborador_id").single();
  if (data) revalidatePath(`/equipo/colaboradores/${data.colaborador_id}`);
}

export async function marcarPagado(fd: FormData) {
  const { supabase } = await soloStaff();
  const { data } = await supabase.from("clientes").update({ pago: "paid" }).eq("id", String(fd.get("id"))).select("colaborador_id").single();
  if (data) revalidatePath(`/equipo/colaboradores/${data.colaborador_id}`);
}

export async function sacarDelArchivo(fd: FormData) {
  const { supabase } = await soloStaff();
  const { data } = await supabase.from("clientes").update({ sacado_de_archivo: true }).eq("id", String(fd.get("id"))).select("colaborador_id").single();
  if (data) revalidatePath(`/equipo/colaboradores/${data.colaborador_id}`);
}

/* ---------- Admin ---------- */
export async function invitar(_: Estado, fd: FormData): Promise<Estado> {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || profile?.rol !== "admin") return { error: "Solo un administrador puede invitar." };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const nombre = String(fd.get("nombre") ?? "").trim() || null;
  const rol = String(fd.get("rol"));
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Correo no válido." };
  if (!["colaborador", "delegado", "admin"].includes(rol)) return { error: "Rol no válido." };
  const { error: e1 } = await supabase.from("invitaciones").upsert({ email, rol, nombre, invitado_por: user.id });
  if (e1) return { error: "No se pudo registrar la invitación." };
  const { error: e2 } = await createServiceClient().auth.admin.inviteUserByEmail(email, {
    redirectTo: `${SITE()}/auth/confirm?next=/crear-contrasena`,
  });
  if (e2) return { error: `Invitación registrada, pero el correo no salió: ${e2.message}` };
  revalidatePath("/equipo/invitar");
  return { ok: `Invitación enviada a ${email}.` };
}
