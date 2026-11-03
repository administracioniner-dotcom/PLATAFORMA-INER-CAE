import nodemailer from "nodemailer";

/** Piezas del aviso por correo, sin dependencias de Next ni de Supabase para poder probarlas de forma aislada. */

export type ConfigCorreo = {
  host: string; port: number; user: string; pass: string; from: string;
  /** Solo se desactiva en las pruebas contra un servidor local sin cifrado. */
  exigirTls?: boolean;
};

/** Lee la configuración SMTP del entorno. Si falta algo, devuelve null y no se envía nada. */
export function leerConfig(env: Record<string, string | undefined> = process.env): ConfigCorreo | null {
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(env.SMTP_PORT ?? 465);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { host, port, user, pass, from: env.SMTP_FROM?.trim() || user };
}

/** Quita saltos de línea y caracteres de control: el nombre va en el asunto del correo. */
export const limpiarNombre = (nombre: string) => nombre.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

const escaparHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function construirCorreo(nombre: string, enlace: string) {
  const quien = limpiarNombre(nombre) || "un colaborador";
  return {
    asunto: `Mensaje nuevo de ${quien}`,
    texto: `${quien} ha escrito en el portal de colaboradores.\n\nAbrir la conversación: ${enlace}\n`,
    html: `<p>${escaparHtml(quien)} ha escrito en el portal de colaboradores.</p><p><a href="${escaparHtml(enlace)}">Abrir la conversación</a></p>`,
  };
}

/** Envía el correo a los destinatarios. Devuelve true si el servidor aceptó al menos una dirección. */
export async function enviarCorreo(cfg: ConfigCorreo, destinatarios: string[], correo: { asunto: string; texto: string; html: string }): Promise<boolean> {
  if (destinatarios.length === 0) return false;
  try {
    const transporte = nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: cfg.port === 465,
      requireTLS: cfg.port !== 465 && cfg.exigirTls !== false,
      ignoreTLS: cfg.exigirTls === false,
      auth: { user: cfg.user, pass: cfg.pass },
      connectionTimeout: 6000, greetingTimeout: 6000, socketTimeout: 10000,
    });
    const r = await transporte.sendMail({ from: cfg.from, to: destinatarios, subject: correo.asunto, text: correo.texto, html: correo.html });
    return r.accepted.length > 0;
  } catch {
    return false;
  }
}

/** A quién se escribe: los administradores con correo válido, sin repetir y sin quien ya está atendiendo a ese colaborador en el portal. */
export function elegirDestinatarios(admins: { id: string; email: string }[], presentes: ReadonlySet<string>): string[] {
  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const correos = admins
    .filter((a) => !presentes.has(a.id))
    .map((a) => a.email.trim().toLowerCase())
    .filter((e) => valido.test(e));
  return [...new Set(correos)];
}
