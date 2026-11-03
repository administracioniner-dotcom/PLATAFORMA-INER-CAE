/** Piezas del aviso a Google Chat, sin dependencias para poder probarlas de forma aislada. */

/** Solo se envía a webhooks de Google Chat: una URL mal copiada no puede sacar datos a otro sitio. */
export function webhookValido(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "chat.googleapis.com";
  } catch {
    return false;
  }
}

/** Quita los caracteres con significado en el formato de Google Chat (*negrita*, _cursiva_, <enlace>, `código`). */
export const limpiarNombre = (nombre: string) => nombre.replace(/[*_~`<>|\r\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

export function construirAviso(nombre: string, enlace: string): string {
  return `*Mensaje nuevo de ${limpiarNombre(nombre) || "un colaborador"}* en el portal de colaboradores.\n<${enlace}|Abrir la conversación>`;
}

type Fetch = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{ ok: boolean }>;

/** Envía el texto al chat. Devuelve true si Google Chat lo aceptó. */
export async function enviarAChat(url: string, texto: string, peticion: Fetch = fetch as unknown as Fetch): Promise<boolean> {
  try {
    const r = await peticion(url, { method: "POST", headers: { "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify({ text: texto }), signal: AbortSignal.timeout(5000) });
    return r.ok;
  } catch {
    return false;
  }
}
