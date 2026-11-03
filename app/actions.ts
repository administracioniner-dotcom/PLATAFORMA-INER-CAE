"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { avisarMensajeNuevo } from "@/lib/avisos";
import { MENSAJE_BLOQUEO, ipDelCliente, limpiarFallos, loginBloqueado, registrarFallo } from "@/lib/intentos";

export type Estado = { error?: string; ok?: string } | undefined;

/* ---------- Validación (el servidor nunca se fía de lo que llega del navegador) ---------- */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ["colaborador", "delegado", "admin"];
const MIN_PASS = 10;
const MAX_PASS = 72; // límite real de bcrypt: por encima, Supabase recortaría la contraseña sin avisar
const MAX_NOMBRE_CLIENTE = 200;
const MAX_NOMBRE_PERSONA = 120;
const MAX_MENSAJE = 5000;
const MAX_MWH = 1_000_000;

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();
const esUuid = (v: string) => UUID.test(v);

function errorContrasena(p: string): string | null {
  if (p.length < MIN_PASS) return `La contraseña debe tener al menos ${MIN_PASS} caracteres.`;
  if (p.length > MAX_PASS) return `La contraseña no puede tener más de ${MAX_PASS} caracteres.`;
  return null;
}

/** Deja constancia de operaciones sensibles. Nunca guarda contraseñas. Un fallo aquí no interrumpe la operación. */
async function auditar(autor: string, accion: string, registroId: string, despues?: Record<string, unknown>) {
  try {
    await createServiceClient().from("audit_log").insert({ tabla: "auth.users", registro_id: registroId, accion, despues: despues ?? null, autor });
  } catch { /* la auditoría es complementaria */ }
}

/* ---------- Acceso ---------- */
export async function iniciarSesion(_: Estado, fd: FormData): Promise<Estado> {
  const email = texto(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };
  if (email.length > 254 || password.length > 200) return { error: "Correo o contraseña incorrectos." };
  // Límite de intentos: se aplica igual exista o no la cuenta, para no revelar qué correos están registrados.
  const ip = await ipDelCliente();
  if (await loginBloqueado(email, ip)) return { error: MENSAJE_BLOQUEO };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    await registrarFallo(email, ip);
    return { error: "Correo o contraseña incorrectos." };
  }
  await limpiarFallos(email, ip);
  // El rol lo decide el servidor según la cuenta, no la URL por la que entró.
  const { profile } = await getSessionProfile();
  if (!profile) {
    await supabase.auth.signOut();
    return { error: "Tu cuenta no está activa. Contacta con INER." };
  }
  redirect(profile.rol === "colaborador" ? "/" : "/equipo");
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/* ---------- Colaborador ---------- */
export async function solicitarPago(fd: FormData): Promise<Estado> {
  const id = texto(fd, "id");
  if (!esUuid(id)) return { error: "Cliente no válido." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("solicitar_pago", { p_cliente: id });
  if (error) return { error: "No se pudo solicitar el pago de este cliente." };
  revalidatePath("/");
  return { ok: "Pago solicitado. INER lo revisará." };
}

/* ---------- Mensajes (colaborador y equipo) ---------- */
export async function enviarMensaje(fd: FormData): Promise<Estado> {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const cuerpo = texto(fd, "texto");
  if (!cuerpo) return { error: "Escribe un mensaje." };
  if (cuerpo.length > MAX_MENSAJE) return { error: `El mensaje no puede superar ${MAX_MENSAJE} caracteres.` };
  const clienteId = texto(fd, "cliente_id") || null;
  const colaboradorId = profile.rol === "colaborador" ? user.id : texto(fd, "colaborador_id");
  if (!esUuid(colaboradorId) || (clienteId && !esUuid(clienteId))) return { error: "Conversación no válida." };
  const { error } = await supabase.from("mensajes").insert({
    colaborador_id: colaboradorId,
    cliente_id: clienteId,
    texto: cuerpo,
    autor: user.id,
    remitente: profile.rol === "colaborador" ? "colaborador" : "delegado",
    es_sistema: false,
  });
  if (error) return { error: "No se pudo enviar el mensaje." };
  // Cuando escribe un colaborador, avisa al equipo (después de responder, sin retrasar el envío).
  if (profile.rol === "colaborador") after(() => avisarMensajeNuevo(user.id, profile.nombre ?? profile.email));
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
  const nombre = texto(fd, "nombre");
  const colaboradorId = texto(fd, "colaborador_id");
  if (!nombre) return { error: "Escribe el nombre del cliente." };
  if (nombre.length > MAX_NOMBRE_CLIENTE) return { error: `El nombre no puede superar ${MAX_NOMBRE_CLIENTE} caracteres.` };
  if (!esUuid(colaboradorId)) return { error: "Falta el colaborador." };
  const { error } = await supabase.from("clientes").insert({ colaborador_id: colaboradorId, nombre });
  if (error) return { error: "No se pudo añadir el cliente." };
  revalidatePath(`/equipo/colaboradores/${colaboradorId}`);
  return { ok: "Cliente añadido." };
}

export async function moverFase(fd: FormData): Promise<Estado> {
  const { supabase } = await soloStaff();
  const id = texto(fd, "id");
  const delta = Number(fd.get("delta"));
  if (!esUuid(id) || (delta !== 1 && delta !== -1)) return { error: "Petición no válida." };
  const { data } = await supabase.from("clientes").select("fase,colaborador_id").eq("id", id).single();
  if (!data) return { error: "No se encontró el cliente." };
  const nueva = Math.min(4, Math.max(0, data.fase + delta));
  if (nueva !== data.fase) {
    const { error } = await supabase.from("clientes").update({ fase: nueva }).eq("id", id);
    if (error) return { error: "No se pudo cambiar la fase." };
  }
  revalidatePath(`/equipo/colaboradores/${data.colaborador_id}`);
  return { ok: "Fase actualizada" };
}

/** Guarda MWh y porcentaje del colaborador en una sola operación. */
export async function guardarDatosCliente(fd: FormData): Promise<Estado> {
  const { supabase } = await soloStaff();
  const id = texto(fd, "id");
  const v = texto(fd, "mwh").replace(",", ".");
  const mwh = v === "" ? null : Number(v);
  const pct = Number(texto(fd, "pct").replace(",", "."));
  if (!esUuid(id)) return { error: "Petición no válida." };
  if (mwh !== null && (!Number.isFinite(mwh) || mwh < 0 || mwh > MAX_MWH)) return { error: "Los MWh deben ser un número entre 0 y 1.000.000." };
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return { error: "El porcentaje debe estar entre 0 y 100." };
  const { data, error } = await supabase.from("clientes").update({ mwh, pct }).eq("id", id).select("colaborador_id").single();
  if (error || !data) return { error: "No se pudieron guardar los datos." };
  revalidatePath(`/equipo/colaboradores/${data.colaborador_id}`);
  return { ok: "Datos guardados" };
}

export async function marcarPagado(fd: FormData): Promise<Estado> {
  const { supabase } = await soloStaff();
  const id = texto(fd, "id");
  if (!esUuid(id)) return { error: "Petición no válida." };
  const { data, error } = await supabase.from("clientes").update({ pago: "paid" }).eq("id", id).select("colaborador_id").single();
  if (error || !data) return { error: "No se pudo marcar como pagado." };
  revalidatePath(`/equipo/colaboradores/${data.colaborador_id}`);
  return { ok: "Marcado como pagado" };
}

export async function sacarDelArchivo(fd: FormData): Promise<Estado> {
  const { supabase } = await soloStaff();
  const id = texto(fd, "id");
  if (!esUuid(id)) return { error: "Petición no válida." };
  const { data, error } = await supabase.from("clientes").update({ sacado_de_archivo: true }).eq("id", id).select("colaborador_id").single();
  if (error || !data) return { error: "No se pudo sacar del archivo." };
  revalidatePath(`/equipo/colaboradores/${data.colaborador_id}`);
  return { ok: "Cliente fuera del archivo" };
}

/* ---------- Admin ---------- */
/** El admin fija una contraseña nueva para una cuenta, sin depender del correo. */
export async function restablecerContrasena(_: Estado, fd: FormData): Promise<Estado> {
  const { user, profile } = await getSessionProfile();
  if (!user || profile?.rol !== "admin") return { error: "Solo un administrador puede cambiar contraseñas." };
  const id = texto(fd, "colaborador_id");
  const password = String(fd.get("password") ?? "");
  if (!esUuid(id)) return { error: "Falta la cuenta." };
  const problema = errorContrasena(password);
  if (problema) return { error: problema };
  const { error } = await createServiceClient().auth.admin.updateUserById(id, { password });
  if (error) return { error: "No se pudo cambiar la contraseña." };
  await auditar(user.id, "CONTRASENA_CAMBIADA_POR_ADMIN", id);
  return { ok: "Contraseña cambiada. Ya puede entrar con la nueva." };
}

/** Crea la cuenta directamente con correo y contraseña (sin correo de invitación). */
export async function crearCuenta(_: Estado, fd: FormData): Promise<Estado> {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || profile?.rol !== "admin") return { error: "Solo un administrador puede crear cuentas." };
  const email = texto(fd, "email").toLowerCase();
  const nombre = texto(fd, "nombre") || null;
  const password = String(fd.get("password") ?? "");
  const rol = texto(fd, "rol");
  if (!EMAIL.test(email) || email.length > 254) return { error: "Correo no válido." };
  if (nombre && nombre.length > MAX_NOMBRE_PERSONA) return { error: `El nombre no puede superar ${MAX_NOMBRE_PERSONA} caracteres.` };
  if (!ROLES.includes(rol)) return { error: "Rol no válido." };
  const problema = errorContrasena(password);
  if (problema) return { error: problema };
  // El disparador handle_new_user necesita esta invitación para asignar el rol.
  const { error: e1 } = await supabase.from("invitaciones").upsert({ email, rol, nombre, invitado_por: user.id });
  if (e1) return { error: "No se pudo registrar la cuenta." };
  // `app_metadata` solo puede escribirse con la clave de servidor: el registro público no puede falsificar esta marca,
  // y el disparador rechaza cualquier alta que no la lleve.
  const { data: creada, error: e2 } = await createServiceClient().auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { creada_por_admin: true },
    user_metadata: nombre ? { nombre } : undefined,
  });
  if (e2 || !creada.user) {
    return { error: e2 && /already|registered|exists/i.test(e2.message) ? "Ya existe una cuenta con ese correo." : "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }
  await auditar(user.id, "CUENTA_CREADA", creada.user.id, { email, rol });
  revalidatePath("/equipo/invitar");
  revalidatePath("/equipo");
  return { ok: `Cuenta creada para ${email}. Ya puede entrar con esa contraseña.` };
}

/* ---------- Perfil (cualquier cuenta) ---------- */
/** Cambia el nombre propio. Los colaboradores no pueden: es la identidad con la que se les paga, y lo cambia INER. */
export async function guardarNombre(_: Estado, fd: FormData): Promise<Estado> {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  if (profile.rol === "colaborador") return { error: "Tu nombre lo cambia INER. Escríbenos desde Mensajes." };
  const nombre = texto(fd, "nombre");
  if (!nombre) return { error: "Escribe tu nombre." };
  if (nombre.length > MAX_NOMBRE_PERSONA) return { error: `El nombre no puede superar ${MAX_NOMBRE_PERSONA} caracteres.` };
  const { data, error } = await supabase.from("profiles").update({ nombre }).eq("id", user.id).select("id");
  if (error || !data?.length) return { error: "No se pudo guardar el nombre." };
  revalidatePath("/", "layout");
  return { ok: "Nombre guardado" };
}

/** El admin corrige el nombre de cualquier cuenta. El cambio queda en `audit_log` por el disparador de `profiles`. */
export async function cambiarNombreDeCuenta(_: Estado, fd: FormData): Promise<Estado> {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || profile?.rol !== "admin") return { error: "Solo un administrador puede cambiar nombres." };
  const id = texto(fd, "id");
  const nombre = texto(fd, "nombre");
  if (!esUuid(id)) return { error: "Falta la cuenta." };
  if (!nombre) return { error: "Escribe el nombre." };
  if (nombre.length > MAX_NOMBRE_PERSONA) return { error: `El nombre no puede superar ${MAX_NOMBRE_PERSONA} caracteres.` };
  const { data, error } = await supabase.from("profiles").update({ nombre }).eq("id", id).select("id");
  if (error || !data?.length) return { error: "No se pudo cambiar el nombre." };
  revalidatePath(`/equipo/colaboradores/${id}`);
  revalidatePath("/equipo");
  return { ok: "Nombre cambiado" };
}

export async function cambiarMiContrasena(_: Estado, fd: FormData): Promise<Estado> {
  const { supabase, user } = await getSessionProfile();
  if (!user?.email) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const actual = String(fd.get("actual") ?? "");
  const p1 = String(fd.get("password") ?? "");
  const p2 = String(fd.get("password2") ?? "");
  if (!actual) return { error: "Escribe tu contraseña actual." };
  const problema = errorContrasena(p1);
  if (problema) return { error: problema.replace("La contraseña", "La contraseña nueva") };
  if (p1 !== p2) return { error: "Las dos contraseñas nuevas no coinciden." };
  if (p1 === actual) return { error: "La contraseña nueva debe ser distinta de la actual." };
  // Comprobar la contraseña actual es también una vía para probar contraseñas con una sesión robada: mismo límite.
  const ip = await ipDelCliente();
  const clave = user.email.toLowerCase();
  if (await loginBloqueado(clave, ip)) return { error: MENSAJE_BLOQUEO };
  const { error: e1 } = await supabase.auth.signInWithPassword({ email: user.email, password: actual });
  if (e1) {
    await registrarFallo(clave, ip);
    return { error: "La contraseña actual no es correcta." };
  }
  await limpiarFallos(clave, ip);
  const { error: e2 } = await supabase.auth.updateUser({ password: p1 });
  if (e2) return { error: "No se pudo cambiar la contraseña. Prueba con otra." };
  return { ok: "Contraseña cambiada" };
}
