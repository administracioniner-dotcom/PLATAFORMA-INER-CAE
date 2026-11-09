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
async function auditar(autor: string, accion: string, registroId: string | null, despues?: Record<string, unknown>) {
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
  redirect(profile.rol === "colaborador" ? "/" : profile.rol === "cliente" ? "/cliente" : "/equipo");
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

/** Marca como leídos los mensajes que la otra parte ha enviado en una conversación. Solo cuenta si la persona la está viendo. */
export async function marcarLeidos(colaboradorId: string, clienteId: string | null): Promise<void> {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) return;
  const colab = profile.rol === "colaborador" ? user.id : colaboradorId;
  if (!esUuid(colab) || (clienteId && !esUuid(clienteId))) return;
  let q = supabase.from("mensajes").update({ leido: true }).eq("colaborador_id", colab).eq("leido", false);
  q = profile.rol === "colaborador" ? q.neq("remitente", "colaborador") : q.eq("remitente", "colaborador");
  q = clienteId ? q.eq("cliente_id", clienteId) : q.is("cliente_id", null);
  await q;
}

/** Latido del equipo: indica que está viendo la conversación con este colaborador (para no avisarle por correo de lo que ya ve). */
export async function latirPresencia(colaboradorId: string): Promise<void> {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile || profile.rol === "colaborador" || !esUuid(colaboradorId)) return;
  try {
    await createServiceClient().from("presencia_staff").upsert(
      { staff_id: user.id, colaborador_id: colaboradorId, visto_at: new Date().toISOString() },
      { onConflict: "staff_id,colaborador_id" },
    );
  } catch { /* es complementario */ }
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

/** Guarda nombre, MWh, porcentaje del colaborador y precio por MWh del cliente en una sola operación. */
export async function guardarDatosCliente(fd: FormData): Promise<Estado> {
  const { supabase } = await soloStaff();
  const id = texto(fd, "id");
  const nombre = texto(fd, "nombre");
  const v = texto(fd, "mwh").replace(",", ".");
  const mwh = v === "" ? null : Number(v);
  const pct = Number(texto(fd, "pct").replace(",", "."));
  const precio = Number(texto(fd, "precio_mwh").replace(",", "."));
  if (!esUuid(id)) return { error: "Petición no válida." };
  if (!nombre) return { error: "El cliente necesita un nombre." };
  if (nombre.length > MAX_NOMBRE_CLIENTE) return { error: `El nombre no puede superar ${MAX_NOMBRE_CLIENTE} caracteres.` };
  if (mwh !== null && (!Number.isFinite(mwh) || mwh < 0 || mwh > MAX_MWH)) return { error: "Los MWh deben ser un número entre 0 y 1.000.000." };
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return { error: "El porcentaje debe estar entre 0 y 100." };
  if (!Number.isFinite(precio) || precio < 0 || precio > 100_000) return { error: "El precio por MWh debe estar entre 0 y 100.000 €." };
  const { data, error } = await supabase.from("clientes").update({ nombre, mwh, pct, precio_mwh: precio }).eq("id", id).select("colaborador_id").single();
  if (error || !data) return { error: "No se pudieron guardar los datos." };
  revalidatePath(`/equipo/colaboradores/${data.colaborador_id}`);
  revalidatePath("/equipo");
  return { ok: "Datos guardados" };
}

/** Elimina un cliente con su historial y mensajes. Solo administradores (lo exige también la base de datos). */
export async function eliminarCliente(fd: FormData): Promise<Estado> {
  const { user, profile, supabase } = await getSessionProfile();
  if (!user || profile?.rol !== "admin") return { error: "Solo un administrador puede eliminar clientes." };
  const id = texto(fd, "id");
  if (!esUuid(id)) return { error: "Petición no válida." };
  const { data: cliente } = await supabase.from("clientes").select("id,nombre,colaborador_id,pago,mwh").eq("id", id).maybeSingle();
  if (!cliente) return { error: "El cliente ya no existe." };
  const { data: borrado, error } = await supabase.from("clientes").delete().eq("id", id).select("id");
  if (error || !borrado?.length) return { error: "No se pudo eliminar el cliente." };
  await auditar(user.id, "CLIENTE_ELIMINADO", id, { nombre: cliente.nombre, colaborador_id: cliente.colaborador_id, pago: cliente.pago, mwh: cliente.mwh });
  revalidatePath(`/equipo/colaboradores/${cliente.colaborador_id}`);
  revalidatePath("/equipo");
  revalidatePath("/mensajes");
  revalidatePath("/");
  return { ok: "Cliente eliminado." };
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

/* ---------- Mis clientes (los que INER lleva directamente) ---------- */
/** Sesión de una persona del equipo (administrador o delegado), o null. */
async function sesionEquipo() {
  const s = await getSessionProfile();
  return s.user && s.profile && s.profile.rol !== "colaborador" ? { ...s, user: s.user, profile: s.profile } : null;
}
async function sesionAdmin() {
  const s = await sesionEquipo();
  return s && s.profile.rol === "admin" ? s : null;
}
const decimal = (fd: FormData, campo: string) => Number(texto(fd, campo).replace(",", "."));
const refrescarMisClientes = () => { revalidatePath("/equipo/mis-clientes"); revalidatePath("/equipo/mis-clientes/fichas"); revalidatePath("/cliente"); };

export async function crearClienteDirecto(fd: FormData): Promise<Estado> {
  const s = await sesionEquipo();
  if (!s) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const nombre = texto(fd, "nombre");
  const fichaId = texto(fd, "ficha_id");
  if (!nombre) return { error: "Escribe el nombre del cliente." };
  if (nombre.length > MAX_NOMBRE_CLIENTE) return { error: `El nombre no puede superar ${MAX_NOMBRE_CLIENTE} caracteres.` };
  if (!esUuid(fichaId)) return { error: "Elige el tipo de ficha." };
  const { error } = await s.supabase.from("clientes_directos").insert({ nombre, ficha_id: fichaId });
  if (error) return { error: "No se pudo añadir el cliente." };
  refrescarMisClientes();
  return { ok: "Cliente añadido." };
}

export async function guardarClienteDirecto(fd: FormData): Promise<Estado> {
  const s = await sesionEquipo();
  if (!s) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const id = texto(fd, "id");
  const nombre = texto(fd, "nombre");
  const fichaId = texto(fd, "ficha_id");
  const v = texto(fd, "mwh").replace(",", ".");
  const mwh = v === "" ? null : Number(v);
  const precio = decimal(fd, "precio_mwh");
  if (!esUuid(id) || !esUuid(fichaId)) return { error: "Petición no válida." };
  if (!nombre) return { error: "El cliente necesita un nombre." };
  if (nombre.length > MAX_NOMBRE_CLIENTE) return { error: `El nombre no puede superar ${MAX_NOMBRE_CLIENTE} caracteres.` };
  if (mwh !== null && (!Number.isFinite(mwh) || mwh < 0 || mwh > MAX_MWH)) return { error: "Los MWh deben ser un número entre 0 y 1.000.000." };
  if (!Number.isFinite(precio) || precio < 0 || precio > 100_000) return { error: "El precio por MWh debe estar entre 0 y 100.000 €." };
  const { data: antes } = await s.supabase.from("clientes_directos").select("ficha_id").eq("id", id).maybeSingle();
  if (!antes) return { error: "El cliente ya no existe." };
  const { error } = await s.supabase.from("clientes_directos").update({ nombre, ficha_id: fichaId, mwh, precio_mwh: precio }).eq("id", id);
  if (error) return { error: "No se pudieron guardar los datos." };
  // Con otra ficha los documentos son otros: se empieza de cero.
  if (antes.ficha_id !== fichaId) await s.supabase.from("clientes_directos_docs").delete().eq("cliente_id", id);
  refrescarMisClientes();
  return { ok: "Datos guardados" };
}

export async function moverFaseDirecto(fd: FormData): Promise<Estado> {
  const s = await sesionEquipo();
  if (!s) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const id = texto(fd, "id");
  const delta = Number(fd.get("delta"));
  if (!esUuid(id) || (delta !== 1 && delta !== -1)) return { error: "Petición no válida." };
  const { data } = await s.supabase.from("clientes_directos").select("fase").eq("id", id).maybeSingle();
  if (!data) return { error: "El cliente ya no existe." };
  const nueva = Math.min(4, Math.max(0, data.fase + delta));
  if (nueva !== data.fase) {
    const { error } = await s.supabase.from("clientes_directos").update({ fase: nueva }).eq("id", id);
    if (error) return { error: "No se pudo cambiar la fase." };
  }
  refrescarMisClientes();
  return { ok: "Fase actualizada" };
}

/** Marca que INER ya ha pagado al cliente (solo con el CAE expedido) o lo quita. La columna se sigue llamando cobrado_at. */
export async function cambiarCobroDirecto(fd: FormData): Promise<Estado> {
  const s = await sesionEquipo();
  if (!s) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const id = texto(fd, "id");
  const cobrar = texto(fd, "accion") !== "quitar";
  if (!esUuid(id)) return { error: "Petición no válida." };
  const { data } = await s.supabase.from("clientes_directos").select("fase").eq("id", id).maybeSingle();
  if (!data) return { error: "El cliente ya no existe." };
  if (cobrar && data.fase !== 4) return { error: "Solo se puede marcar como pagado cuando el CAE está expedido." };
  const { error } = await s.supabase.from("clientes_directos").update({ cobrado_at: cobrar ? new Date().toISOString() : null }).eq("id", id);
  if (error) return { error: "No se pudo guardar el pago." };
  refrescarMisClientes();
  return { ok: cobrar ? "Marcado como pagado" : "Pago quitado" };
}

export async function eliminarClienteDirecto(fd: FormData): Promise<Estado> {
  const s = await sesionEquipo();
  if (!s) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const id = texto(fd, "id");
  if (!esUuid(id)) return { error: "Petición no válida." };
  const { data: borrado, error } = await s.supabase.from("clientes_directos").delete().eq("id", id).select("id,nombre,mwh,cobrado_at");
  if (error || !borrado?.length) return { error: "No se pudo eliminar el cliente." };
  await auditar(s.user.id, "CLIENTE_DIRECTO_ELIMINADO", id, { nombre: borrado[0].nombre, mwh: borrado[0].mwh, cobrado: !!borrado[0].cobrado_at });
  refrescarMisClientes();
  return { ok: "Cliente eliminado." };
}

/** Marca o desmarca un documento como listo. Respeta «depende de»: no se marca sin el anterior, y al quitar el anterior se quitan los que dependen. */
export async function marcarDocumento(clienteId: string, documentoId: string, listo: boolean): Promise<Estado> {
  const s = await sesionEquipo();
  if (!s) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  if (!esUuid(clienteId) || !esUuid(documentoId) || typeof listo !== "boolean") return { error: "Petición no válida." };
  const [{ data: doc }, { data: cli }] = await Promise.all([
    s.supabase.from("fichas_documento").select("id,ficha_id,depende_de,nombre").eq("id", documentoId).maybeSingle(),
    s.supabase.from("clientes_directos").select("ficha_id").eq("id", clienteId).maybeSingle(),
  ]);
  if (!doc || !cli || doc.ficha_id !== cli.ficha_id) return { error: "Ese documento no pertenece a la ficha del cliente." };
  if (listo && doc.depende_de) {
    const { data: previo } = await s.supabase.from("clientes_directos_docs").select("listo").eq("cliente_id", clienteId).eq("documento_id", doc.depende_de).maybeSingle();
    if (!previo?.listo) return { error: "Antes hay que marcar el documento del que depende." };
  }
  const { error } = await s.supabase.from("clientes_directos_docs").upsert({ cliente_id: clienteId, documento_id: documentoId, listo }, { onConflict: "cliente_id,documento_id" });
  if (error) return { error: "No se pudo guardar el documento." };
  if (!listo) {
    const { data: dependientes } = await s.supabase.from("fichas_documento").select("id").eq("depende_de", documentoId);
    const ids = (dependientes ?? []).map((d) => d.id);
    if (ids.length) await s.supabase.from("clientes_directos_docs").update({ listo: false }).eq("cliente_id", clienteId).in("documento_id", ids);
  }
  refrescarMisClientes();
  return { ok: "Guardado" };
}

/** Fecha de un documento que la pide (por ejemplo, la de la factura). */
export async function guardarFechaDocumento(clienteId: string, documentoId: string, fecha: string): Promise<Estado> {
  const s = await sesionEquipo();
  if (!s) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  if (!esUuid(clienteId) || !esUuid(documentoId)) return { error: "Petición no válida." };
  if (fecha !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "La fecha no es válida." };
  const { error } = await s.supabase.from("clientes_directos_docs").upsert({ cliente_id: clienteId, documento_id: documentoId, fecha: fecha || null }, { onConflict: "cliente_id,documento_id" });
  if (error) return { error: "No se pudo guardar la fecha." };
  refrescarMisClientes();
  return { ok: "Fecha guardada" };
}

/* ---------- Observaciones por fase (las ve el cliente) y acceso del cliente ---------- */
const MAX_OBS = 1000;

export async function anadirObservacion(fd: FormData): Promise<Estado> {
  const s = await sesionEquipo();
  if (!s) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const id = texto(fd, "id");
  const fase = Number(fd.get("fase"));
  const t = texto(fd, "texto");
  if (!esUuid(id) || !Number.isInteger(fase) || fase < 0 || fase > 4) return { error: "Petición no válida." };
  if (!t) return { error: "Escribe la observación." };
  if (t.length > MAX_OBS) return { error: `La observación no puede superar ${MAX_OBS} caracteres.` };
  const { error } = await s.supabase.from("clientes_directos_obs").insert({ cliente_id: id, fase, texto: t, autor: s.user.id });
  if (error) return { error: "No se pudo guardar la observación." };
  refrescarMisClientes();
  return { ok: "Observación guardada. La ve el cliente." };
}

export async function borrarObservacion(fd: FormData): Promise<Estado> {
  const s = await sesionEquipo();
  if (!s) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id) || id < 1) return { error: "Petición no válida." };
  const { data, error } = await s.supabase.from("clientes_directos_obs").delete().eq("id", id).select("id");
  if (error || !data?.length) return { error: "No se pudo borrar la observación." };
  refrescarMisClientes();
  return { ok: "Observación borrada." };
}

/** Crea la cuenta del cliente (correo y contraseña que pone el equipo) y la enlaza con su ficha. */
export async function darAccesoCliente(fd: FormData): Promise<Estado> {
  const s = await sesionEquipo();
  if (!s) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const id = texto(fd, "id");
  const email = texto(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!esUuid(id)) return { error: "Petición no válida." };
  if (!EMAIL.test(email) || email.length > 254) return { error: "Correo no válido." };
  const problema = errorContrasena(password);
  if (problema) return { error: problema };
  const { data: cli } = await s.supabase.from("clientes_directos").select("id,nombre,usuario_id").eq("id", id).maybeSingle();
  if (!cli) return { error: "El cliente ya no existe." };
  if (cli.usuario_id) return { error: "Este cliente ya tiene acceso." };
  const clave = crypto.randomUUID();
  const servicio = createServiceClient();
  const { error: e1 } = await servicio.from("invitaciones").upsert({ email, rol: "cliente", nombre: cli.nombre, invitado_por: s.user.id, clave });
  if (e1) return { error: "No se pudo registrar la cuenta." };
  const { data: creada, error: e2 } = await servicio.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { clave_alta: clave, nombre: cli.nombre } });
  if (e2 || !creada.user) {
    const yaExiste = !!e2 && /already|registered|exists/i.test(e2.message);
    if (yaExiste) await servicio.from("invitaciones").update({ clave: null }).eq("email", email);
    else await servicio.from("invitaciones").delete().eq("email", email);
    return { error: yaExiste ? "Ya existe una cuenta con ese correo." : "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }
  const { error: e3 } = await servicio.from("clientes_directos").update({ usuario_id: creada.user.id, email }).eq("id", id);
  if (e3) {
    await servicio.auth.admin.deleteUser(creada.user.id);
    return { error: "No se pudo enlazar la cuenta con el cliente." };
  }
  await auditar(s.user.id, "ACCESO_CLIENTE_CREADO", creada.user.id, { email, cliente: id });
  refrescarMisClientes();
  return { ok: `Acceso creado para ${email}. Ya puede entrar con esa contraseña.` };
}

/** Quita el acceso: se borra la cuenta del cliente, pero se conserva su ficha, documentos y observaciones. */
export async function quitarAccesoCliente(fd: FormData): Promise<Estado> {
  const s = await sesionEquipo();
  if (!s) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const id = texto(fd, "id");
  if (!esUuid(id)) return { error: "Petición no válida." };
  const { data: cli } = await s.supabase.from("clientes_directos").select("usuario_id,email").eq("id", id).maybeSingle();
  if (!cli?.usuario_id) return { error: "Este cliente no tiene acceso." };
  const servicio = createServiceClient();
  const { data: cuenta } = await servicio.from("profiles").select("rol").eq("id", cli.usuario_id).maybeSingle();
  if (cuenta?.rol !== "cliente") return { error: "Esa cuenta no es de un cliente." };
  const { error } = await servicio.auth.admin.deleteUser(cli.usuario_id);
  if (error) return { error: "No se pudo quitar el acceso." };
  await servicio.from("invitaciones").delete().eq("email", cli.email ?? "");
  await servicio.from("clientes_directos").update({ usuario_id: null }).eq("id", id);
  await auditar(s.user.id, "ACCESO_CLIENTE_QUITADO", cli.usuario_id, { cliente: id });
  refrescarMisClientes();
  return { ok: "Acceso quitado." };
}

/** El equipo fija una contraseña nueva al cliente. */
export async function contrasenaCliente(fd: FormData): Promise<Estado> {
  const s = await sesionEquipo();
  if (!s) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const id = texto(fd, "id");
  const password = String(fd.get("password") ?? "");
  if (!esUuid(id)) return { error: "Petición no válida." };
  const problema = errorContrasena(password);
  if (problema) return { error: problema };
  const { data: cli } = await s.supabase.from("clientes_directos").select("usuario_id").eq("id", id).maybeSingle();
  if (!cli?.usuario_id) return { error: "Este cliente no tiene acceso." };
  const { error } = await createServiceClient().auth.admin.updateUserById(cli.usuario_id, { password });
  if (error) return { error: "No se pudo cambiar la contraseña." };
  await auditar(s.user.id, "CONTRASENA_CLIENTE_CAMBIADA", cli.usuario_id);
  return { ok: "Contraseña cambiada. Ya puede entrar con la nueva." };
}

/* ---------- Fichas y sus documentos (solo administradores) ---------- */
const MAX_GRUPO = 120, MAX_DOC = 200, MAX_AYUDA = 400;
function leerFicha(fd: FormData) {
  const codigo = texto(fd, "codigo"), nombre = texto(fd, "nombre");
  if (!codigo || codigo.length > 40) return { error: "El código de la ficha (por ejemplo RES060) debe tener entre 1 y 40 caracteres." } as const;
  if (!nombre || nombre.length > 120) return { error: "Escribe el nombre de la ficha (hasta 120 caracteres)." } as const;
  return { codigo, nombre } as const;
}
function leerDocumento(fd: FormData) {
  const grupo = texto(fd, "grupo"), nombre = texto(fd, "nombre"), ayuda = texto(fd, "ayuda");
  const depende = texto(fd, "depende_de"), anios = texto(fd, "aviso_anios");
  const aporta = texto(fd, "aporta") === "iner" ? "iner" : "cliente";
  if (!grupo || grupo.length > MAX_GRUPO) return { error: `El grupo (la carpeta) debe tener entre 1 y ${MAX_GRUPO} caracteres.` } as const;
  if (!nombre || nombre.length > MAX_DOC) return { error: `Escribe el nombre del documento (hasta ${MAX_DOC} caracteres).` } as const;
  if (ayuda.length > MAX_AYUDA) return { error: `La ayuda no puede superar ${MAX_AYUDA} caracteres.` } as const;
  if (depende && !esUuid(depende)) return { error: "El documento del que depende no es válido." } as const;
  const aviso = anios === "" ? null : Number(anios);
  if (aviso !== null && (!Number.isInteger(aviso) || aviso < 1 || aviso > 50)) return { error: "Los años de aviso deben ser un número entero entre 1 y 50." } as const;
  return { grupo, nombre, ayuda: ayuda || null, depende_de: depende || null, aviso_anios: aviso, aporta } as const;
}

export async function crearFicha(_: Estado, fd: FormData): Promise<Estado> {
  const s = await sesionAdmin();
  if (!s) return { error: "Solo un administrador puede crear fichas." };
  const f = leerFicha(fd);
  if ("error" in f) return { error: f.error };
  const { error } = await s.supabase.from("fichas_tipo").insert(f);
  if (error) return { error: error.code === "23505" ? "Ya existe una ficha con ese código." : "No se pudo crear la ficha." };
  refrescarMisClientes();
  return { ok: `Ficha ${f.codigo} creada. Añade abajo los documentos que se piden.` };
}

export async function guardarFicha(_: Estado, fd: FormData): Promise<Estado> {
  const s = await sesionAdmin();
  if (!s) return { error: "Solo un administrador puede cambiar fichas." };
  const id = texto(fd, "id");
  const f = leerFicha(fd);
  if (!esUuid(id)) return { error: "Falta la ficha." };
  if ("error" in f) return { error: f.error };
  const { error } = await s.supabase.from("fichas_tipo").update(f).eq("id", id);
  if (error) return { error: error.code === "23505" ? "Ya existe una ficha con ese código." : "No se pudo guardar la ficha." };
  refrescarMisClientes();
  return { ok: "Ficha guardada" };
}

export async function eliminarFicha(fd: FormData): Promise<Estado> {
  const s = await sesionAdmin();
  if (!s) return { error: "Solo un administrador puede eliminar fichas." };
  const id = texto(fd, "id");
  if (!esUuid(id)) return { error: "Falta la ficha." };
  const { count } = await s.supabase.from("clientes_directos").select("id", { count: "exact", head: true }).eq("ficha_id", id);
  if (count) return { error: `Hay ${count} cliente${count > 1 ? "s" : ""} con esta ficha. Cámbialos de ficha o elimínalos antes.` };
  const { error } = await s.supabase.from("fichas_tipo").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la ficha." };
  refrescarMisClientes();
  return { ok: "Ficha eliminada." };
}

export async function anadirDocumento(_: Estado, fd: FormData): Promise<Estado> {
  const s = await sesionAdmin();
  if (!s) return { error: "Solo un administrador puede cambiar fichas." };
  const fichaId = texto(fd, "ficha_id");
  const d = leerDocumento(fd);
  if (!esUuid(fichaId)) return { error: "Falta la ficha." };
  if ("error" in d) return { error: d.error };
  if (d.depende_de) {
    const { data: dep } = await s.supabase.from("fichas_documento").select("ficha_id").eq("id", d.depende_de).maybeSingle();
    if (!dep || dep.ficha_id !== fichaId) return { error: "Solo puede depender de un documento de la misma ficha." };
  }
  const { data: ultimo } = await s.supabase.from("fichas_documento").select("orden").eq("ficha_id", fichaId).order("orden", { ascending: false }).limit(1).maybeSingle();
  const { error } = await s.supabase.from("fichas_documento").insert({ ficha_id: fichaId, ...d, orden: (ultimo?.orden ?? 0) + 10 });
  if (error) return { error: "No se pudo añadir el documento." };
  refrescarMisClientes();
  return { ok: "Documento añadido." };
}

export async function guardarDocumento(_: Estado, fd: FormData): Promise<Estado> {
  const s = await sesionAdmin();
  if (!s) return { error: "Solo un administrador puede cambiar fichas." };
  const id = texto(fd, "id");
  const d = leerDocumento(fd);
  if (!esUuid(id)) return { error: "Falta el documento." };
  if ("error" in d) return { error: d.error };
  const { data: doc } = await s.supabase.from("fichas_documento").select("ficha_id").eq("id", id).maybeSingle();
  if (!doc) return { error: "El documento ya no existe." };
  if (d.depende_de) {
    if (d.depende_de === id) return { error: "Un documento no puede depender de sí mismo." };
    const { data: dep } = await s.supabase.from("fichas_documento").select("ficha_id,depende_de").eq("id", d.depende_de).maybeSingle();
    if (!dep || dep.ficha_id !== doc.ficha_id) return { error: "Solo puede depender de un documento de la misma ficha." };
    if (dep.depende_de === id) return { error: "Esos dos documentos dependerían el uno del otro." };
  }
  const { error } = await s.supabase.from("fichas_documento").update(d).eq("id", id);
  if (error) return { error: "No se pudo guardar el documento." };
  refrescarMisClientes();
  return { ok: "Documento guardado" };
}

export async function eliminarDocumento(fd: FormData): Promise<Estado> {
  const s = await sesionAdmin();
  if (!s) return { error: "Solo un administrador puede cambiar fichas." };
  const id = texto(fd, "id");
  if (!esUuid(id)) return { error: "Falta el documento." };
  const { error } = await s.supabase.from("fichas_documento").delete().eq("id", id);
  if (error) return { error: "No se pudo quitar el documento." };
  refrescarMisClientes();
  return { ok: "Documento quitado." };
}

/** Sube o baja un documento dentro de su grupo. */
export async function moverDocumento(fd: FormData): Promise<Estado> {
  const s = await sesionAdmin();
  if (!s) return { error: "Solo un administrador puede cambiar fichas." };
  const id = texto(fd, "id");
  const delta = Number(fd.get("delta"));
  if (!esUuid(id) || (delta !== 1 && delta !== -1)) return { error: "Petición no válida." };
  const { data: doc } = await s.supabase.from("fichas_documento").select("id,ficha_id,grupo,orden").eq("id", id).maybeSingle();
  if (!doc) return { error: "El documento ya no existe." };
  let q = s.supabase.from("fichas_documento").select("id,orden").eq("ficha_id", doc.ficha_id).eq("grupo", doc.grupo);
  q = delta === -1 ? q.lt("orden", doc.orden).order("orden", { ascending: false }) : q.gt("orden", doc.orden).order("orden", { ascending: true });
  const { data: vecino } = await q.limit(1).maybeSingle();
  if (!vecino) return { ok: "Ya está en su sitio" };
  await s.supabase.from("fichas_documento").update({ orden: vecino.orden }).eq("id", doc.id);
  await s.supabase.from("fichas_documento").update({ orden: doc.orden }).eq("id", vecino.id);
  refrescarMisClientes();
  return { ok: "Orden cambiado" };
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
  const { user, profile } = await getSessionProfile();
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
  // El disparador handle_new_user necesita esta invitación para asignar el rol, y una clave de un solo uso
  // que solo conoce este servidor: quien se registre por su cuenta no puede completar el alta.
  const clave = crypto.randomUUID();
  const servicio = createServiceClient();
  const { error: e1 } = await servicio.from("invitaciones").upsert({ email, rol, nombre, invitado_por: user.id, clave });
  if (e1) return { error: "No se pudo registrar la cuenta." };
  const { data: creada, error: e2 } = await servicio.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { clave_alta: clave, ...(nombre ? { nombre } : {}) },
  });
  if (e2 || !creada.user) {
    const yaExiste = !!e2 && /already|registered|exists/i.test(e2.message);
    // Si la cuenta no llegó a crearse, no dejamos la invitación colgada.
    if (yaExiste) await servicio.from("invitaciones").update({ clave: null }).eq("email", email);
    else await servicio.from("invitaciones").delete().eq("email", email);
    return { error: yaExiste ? "Ya existe una cuenta con ese correo." : "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }
  await auditar(user.id, "CUENTA_CREADA", creada.user.id, { email, rol });
  revalidatePath("/equipo/invitar");
  revalidatePath("/equipo");
  return { ok: `Cuenta creada para ${email}. Ya puede entrar con esa contraseña.` };
}

/** Borra una invitación que nadie usó. Si ya hay una cuenta con ese correo, no toca nada: para eso está "Eliminar para siempre". */
export async function borrarInvitacion(_: Estado, fd: FormData): Promise<Estado> {
  const { user, profile } = await getSessionProfile();
  if (!user || profile?.rol !== "admin") return { error: "Solo un administrador puede hacerlo." };
  const email = texto(fd, "email").toLowerCase();
  if (!EMAIL.test(email)) return { error: "Falta el correo de la invitación." };
  const admin = createServiceClient();
  const { data: cuenta } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (cuenta) return { error: "Ese correo ya tiene una cuenta. Gestiónala en la lista de cuentas." };
  const { error } = await admin.from("invitaciones").delete().eq("email", email);
  if (error) return { error: "No se pudo borrar la invitación." };
  await auditar(user.id, "INVITACION_BORRADA", null, { email });
  revalidatePath("/equipo/invitar");
  return { ok: "Invitación borrada." };
}

/** Desactiva o reactiva una cuenta: no puede entrar, pero se conservan sus clientes, pagos y mensajes. */
export async function cambiarEstadoCuenta(_: Estado, fd: FormData): Promise<Estado> {
  const { user, profile } = await getSessionProfile();
  if (!user || profile?.rol !== "admin") return { error: "Solo un administrador puede hacerlo." };
  const id = texto(fd, "id");
  const activar = texto(fd, "accion") === "reactivar";
  if (!esUuid(id)) return { error: "Falta la cuenta." };
  if (id === user.id) return { error: "No puedes desactivar tu propia cuenta." };
  const { error } = await createServiceClient().auth.admin.updateUserById(id, { ban_duration: activar ? "none" : "876000h" });
  if (error) return { error: "No se pudo cambiar el estado de la cuenta." };
  await auditar(user.id, activar ? "CUENTA_REACTIVADA" : "CUENTA_DESACTIVADA", id);
  revalidatePath("/equipo/invitar");
  revalidatePath("/equipo");
  return { ok: activar ? "Cuenta reactivada. Ya puede entrar." : "Cuenta desactivada. No puede entrar; sus datos se conservan." };
}

/** Elimina una cuenta para siempre, con sus clientes, historial y mensajes. Exige escribir el correo para confirmar. */
export async function eliminarCuenta(_: Estado, fd: FormData): Promise<Estado> {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || profile?.rol !== "admin") return { error: "Solo un administrador puede eliminar cuentas." };
  const id = texto(fd, "id");
  if (!esUuid(id)) return { error: "Falta la cuenta." };
  if (id === user.id) return { error: "No puedes eliminar tu propia cuenta." };
  const { data: objetivo } = await supabase.from("profiles").select("id,email,rol").eq("id", id).maybeSingle();
  if (!objetivo) return { error: "La cuenta ya no existe." };
  if (texto(fd, "confirmar").toLowerCase() !== objetivo.email.toLowerCase()) return { error: "Escribe el correo exacto de la cuenta para confirmar." };
  const admin = createServiceClient();
  const { count: clientes } = await admin.from("clientes").select("id", { count: "exact", head: true }).eq("colaborador_id", id);
  const { count: pagados } = await admin.from("clientes").select("id", { count: "exact", head: true }).eq("colaborador_id", id).eq("pago", "paid");
  // clientes.colaborador_id es RESTRICT: primero sus clientes (arrastran historial y mensajes), luego la cuenta (arrastra perfil y mensajes).
  const { error: e1 } = await admin.from("clientes").delete().eq("colaborador_id", id);
  if (e1) return { error: "No se pudieron borrar los clientes de la cuenta. No se ha eliminado nada más." };
  const { error: e2 } = await admin.auth.admin.deleteUser(id);
  if (e2) return { error: "No se pudo eliminar la cuenta. Inténtalo de nuevo." };
  await admin.from("invitaciones").delete().eq("email", objetivo.email);
  await auditar(user.id, "CUENTA_ELIMINADA", id, { email: objetivo.email, rol: objetivo.rol, clientes: clientes ?? 0, clientes_pagados: pagados ?? 0 });
  revalidatePath("/equipo/invitar");
  revalidatePath("/equipo");
  return { ok: "Cuenta eliminada." };
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
