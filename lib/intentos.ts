import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { VENTANA_MINUTOS, debeBloquear } from "@/lib/limites";

/**
 * Límite de intentos de inicio de sesión. El login lo hace el servidor de Vercel, así que el límite por IP de
 * Supabase vería siempre la misma IP y afectaría a todos: se cuenta aquí, con la IP real del visitante.
 * Si la comprobación falla (base de datos caída), NO se bloquea a nadie: la disponibilidad pesa más que el límite.
 */

export const MENSAJE_BLOQUEO = `Demasiados intentos fallidos. Espera ${VENTANA_MINUTOS} minutos y vuelve a intentarlo, o pide ayuda a INER.`;

export async function ipDelCliente(): Promise<string> {
  const h = await headers();
  // En Vercel estas cabeceras las pone la plataforma con la IP real del visitante; no las controla el cliente.
  const valor = h.get("x-vercel-forwarded-for") ?? h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "";
  return valor.split(",")[0].trim().slice(0, 64) || "desconocida";
}

export async function loginBloqueado(email: string, ip: string): Promise<boolean> {
  try {
    const db = createServiceClient();
    const desde = new Date(Date.now() - VENTANA_MINUTOS * 60_000).toISOString();
    const base = () => db.from("intentos_login").select("id", { count: "exact", head: true }).gte("fecha", desde);
    const [a, b, c] = await Promise.all([base().eq("email", email).eq("ip", ip), base().eq("ip", ip), base().eq("email", email)]);
    if (a.error || b.error || c.error) return false;
    return debeBloquear({ cuentaDesdeUnaIp: a.count ?? 0, ip: b.count ?? 0, cuenta: c.count ?? 0 });
  } catch {
    return false;
  }
}

export async function registrarFallo(email: string, ip: string): Promise<void> {
  try { await createServiceClient().from("intentos_login").insert({ email, ip }); } catch { /* ver nota de disponibilidad */ }
}

/** Tras un acceso correcto se olvidan los fallos de esa cuenta desde esa IP. */
export async function limpiarFallos(email: string, ip: string): Promise<void> {
  try { await createServiceClient().from("intentos_login").delete().eq("email", email).eq("ip", ip); } catch { /* idem */ }
}
