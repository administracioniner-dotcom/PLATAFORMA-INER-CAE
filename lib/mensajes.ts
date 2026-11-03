import type { Mensaje } from "@/lib/types";

/** Colores de los círculos de iniciales de las personas (siempre el mismo para la misma persona). */
const COLORES = ["#2F6FE0", "#0EA394", "#C77A00", "#EA5409", "#7C3AED", "#0F766E", "#BE185D"];
export function colorDe(clave: string) {
  let h = 0;
  for (const c of clave) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES[h % COLORES.length];
}

export type Conversacion = {
  clave: string; titulo: string; clienteId: string | null; fase: number | null;
  ultimoTexto: string | null; ultimoFecha: string | null; ultimoMio: boolean; noLeidos: number;
};

/** Una conversación por cliente más la general. `mensajes` va de más reciente a más antiguo.
 *  `recibido` dice si el mensaje es para quien mira (cuenta como no leído) y `esMio` si lo escribió quien mira. */
export function conversaciones(
  mensajes: Mensaje[], clientes: { id: string; nombre: string; fase?: number }[],
  recibido: (m: Mensaje) => boolean, esMio: (m: Mensaje) => boolean,
): Conversacion[] {
  const mapa = new Map<string, Conversacion>();
  mapa.set("general", { clave: "general", titulo: "Conversación general", clienteId: null, fase: null, ultimoTexto: null, ultimoFecha: null, ultimoMio: false, noLeidos: 0 });
  for (const c of clientes) mapa.set(c.id, { clave: c.id, titulo: c.nombre, clienteId: c.id, fase: c.fase ?? null, ultimoTexto: null, ultimoFecha: null, ultimoMio: false, noLeidos: 0 });
  for (const m of mensajes) {
    const k = m.cliente_id ?? "general";
    const h = mapa.get(k);
    if (!h) continue;
    if (!h.ultimoFecha) { h.ultimoTexto = m.texto; h.ultimoFecha = m.fecha; h.ultimoMio = esMio(m); }
    if (!m.leido && recibido(m)) h.noLeidos++;
  }
  // Con mensajes: la más reciente primero. Sin mensajes: la general y luego los clientes por nombre.
  return [...mapa.values()].sort((a, b) => {
    if (a.ultimoFecha && b.ultimoFecha) return b.ultimoFecha.localeCompare(a.ultimoFecha);
    if (a.ultimoFecha) return -1;
    if (b.ultimoFecha) return 1;
    if (a.clave === "general") return -1;
    if (b.clave === "general") return 1;
    return a.titulo.localeCompare(b.titulo, "es");
  });
}

/** Parte un aviso automático en trozos para poner en negrita lo que va entre «comillas», y elige su icono. */
export function evento(texto: string) {
  const icono = /pago|pagado/i.test(texto) ? "€" : /añadido/i.test(texto) ? "+" : /CAE expedido/i.test(texto) ? "✓" : /fase/i.test(texto) ? "→" : "•";
  const partes = texto.split(/(«[^»]+»)/).filter(Boolean).map((t) => ({ t, negrita: t.startsWith("«") }));
  return { icono, partes };
}
