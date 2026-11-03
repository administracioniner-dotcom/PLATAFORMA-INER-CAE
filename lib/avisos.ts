import { createServiceClient } from "@/lib/supabase/server";
import { construirCorreo, enviarCorreo, leerConfig } from "@/lib/correo";

/** Minutos mínimos entre dos avisos del mismo colaborador: una ráfaga de mensajes genera un solo correo. */
const MINUTOS_ENTRE_AVISOS = 10;
const SITIO = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://plataforma-iner-cae.vercel.app").replace(/\/$/, "");
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Avisa por correo a las cuentas de administrador de que un colaborador ha escrito. Nunca lanza errores: si el aviso
 * falla, el mensaje ya está guardado y el equipo lo verá igualmente en el portal.
 * La cuenta de envío está en las variables de entorno SMTP_* (secretos: no van en el código ni en los registros).
 */
export async function avisarMensajeNuevo(colaboradorId: string, nombre: string): Promise<void> {
  const config = leerConfig();
  if (!config) return;
  try {
    const db = createServiceClient();
    const { data: admins } = await db.from("profiles").select("email").eq("rol", "admin");
    const destinatarios = [...new Set((admins ?? []).map((a) => a.email.trim().toLowerCase()).filter((e) => CORREO_VALIDO.test(e)))];
    if (destinatarios.length === 0) return;
    const { data: toca, error } = await db.rpc("reclamar_aviso_mensaje", { p_colaborador: colaboradorId, p_minutos: MINUTOS_ENTRE_AVISOS });
    if (error || toca !== true) return;
    const enviado = await enviarCorreo(config, destinatarios, construirCorreo(nombre, `${SITIO}/equipo/mensajes?c=${colaboradorId}`));
    // Si el servidor de correo no lo aceptó, se libera la reserva para que el siguiente mensaje lo vuelva a intentar.
    if (!enviado) await db.from("avisos_mensajes").delete().eq("colaborador_id", colaboradorId);
  } catch {
    /* el aviso es complementario */
  }
}
