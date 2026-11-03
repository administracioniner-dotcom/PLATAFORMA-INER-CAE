import { createServiceClient } from "@/lib/supabase/server";
import { construirAviso, enviarAChat, webhookValido } from "@/lib/chat";

/** Minutos mínimos entre dos avisos del mismo colaborador: una ráfaga de mensajes genera un solo aviso. */
const MINUTOS_ENTRE_AVISOS = 10;
const SITIO = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://plataforma-iner-cae.vercel.app").replace(/\/$/, "");

/**
 * Avisa al equipo en Google Chat de que un colaborador ha escrito. Nunca lanza errores: si el aviso falla,
 * el mensaje ya está guardado y el equipo lo verá igualmente en el portal.
 * El webhook está en la variable de entorno AVISO_CHAT_WEBHOOK (es un secreto: no se escribe en el código ni en los registros).
 */
export async function avisarMensajeNuevo(colaboradorId: string, nombre: string): Promise<void> {
  const url = process.env.AVISO_CHAT_WEBHOOK;
  if (!webhookValido(url)) return;
  try {
    const db = createServiceClient();
    const { data: toca, error } = await db.rpc("reclamar_aviso_mensaje", { p_colaborador: colaboradorId, p_minutos: MINUTOS_ENTRE_AVISOS });
    if (error || toca !== true) return;
    const enviado = await enviarAChat(url, construirAviso(nombre, `${SITIO}/equipo/mensajes?c=${colaboradorId}`));
    // Si Google Chat no lo aceptó, se libera la reserva para que el siguiente mensaje lo vuelva a intentar.
    if (!enviado) await db.from("avisos_mensajes").delete().eq("colaborador_id", colaboradorId);
  } catch {
    /* el aviso es complementario */
  }
}
