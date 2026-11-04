import { createServiceClient } from "@/lib/supabase/server";
import { construirCorreo, elegirDestinatarios, enviarCorreo, leerConfig } from "@/lib/correo";

/** Minutos mínimos entre dos avisos del mismo colaborador: una ráfaga de mensajes genera un solo correo. */
const MINUTOS_ENTRE_AVISOS = 10;
const SITIO = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://plataforma-iner-cae.vercel.app").replace(/\/$/, "");
/** Segundos que cuenta un latido: se envía cada 25 s mientras la conversación está abierta y a la vista. */
const SEGUNDOS_PRESENCIA = 60;

/**
 * Avisa por correo a las cuentas de administrador de que un colaborador ha escrito. Nunca lanza errores: si el aviso
 * falla, el mensaje ya está guardado y el equipo lo verá igualmente en el portal.
 * La cuenta de envío está en las variables de entorno SMTP_* (secretos: no van en el código ni en los registros).
 */
export async function avisarMensajeNuevo(colaboradorId: string, nombre: string): Promise<void> {
  const config = leerConfig();
  if (!config) { console.warn("[aviso] sin configuración de correo (faltan variables SMTP_*): no se envía"); return; }
  try {
    const db = createServiceClient();
    const { data: admins } = await db.from("profiles").select("id,email").eq("rol", "admin");
    // Quien está ahora mismo en el portal con la conversación de este colaborador abierta ya lo ve: no se le escribe.
    // Si no se puede consultar, se avisa a todos (mejor un correo de más que un mensaje sin ver).
    const { data: latidos } = await db.from("presencia_staff").select("staff_id").eq("colaborador_id", colaboradorId)
      .gte("visto_at", new Date(Date.now() - SEGUNDOS_PRESENCIA * 1000).toISOString());
    const destinatarios = elegirDestinatarios(admins ?? [], new Set((latidos ?? []).map((l) => l.staff_id)));
    // Si nadie queda por avisar, no se gasta la reserva de los 10 minutos: el siguiente mensaje sí podrá avisar.
    if (destinatarios.length === 0) { console.info(`[aviso] sin destinatarios: ${(admins ?? []).length} administradores, ${(latidos ?? []).length} con la conversación abierta`); return; }
    const { data: toca, error } = await db.rpc("reclamar_aviso_mensaje", { p_colaborador: colaboradorId, p_minutos: MINUTOS_ENTRE_AVISOS });
    if (error || toca !== true) { console.info(error ? `[aviso] no se pudo reservar el aviso: ${error.message}` : "[aviso] ya se avisó hace menos de 10 minutos de este colaborador"); return; }
    const enviado = await enviarCorreo(config, destinatarios, construirCorreo(nombre, `${SITIO}/equipo/mensajes?c=${colaboradorId}`));
    // Si el servidor de correo no lo aceptó, se libera la reserva para que el siguiente mensaje lo vuelva a intentar.
    if (enviado) console.info(`[aviso] correo enviado a ${destinatarios.length} destinatario(s)`);
    else await db.from("avisos_mensajes").delete().eq("colaborador_id", colaboradorId);
  } catch (e) {
    console.warn("[aviso] error inesperado:", e instanceof Error ? e.message : "desconocido"); // el aviso es complementario
  }
}
