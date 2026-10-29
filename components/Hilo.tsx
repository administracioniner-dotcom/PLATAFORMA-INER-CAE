import { enviarMensaje } from "@/app/actions";
import { Submit } from "@/components/Submit";
import { cx, fechaHora } from "@/lib/utils";
import type { Mensaje } from "@/lib/types";

export function Hilo({ mensajes, colaboradorId, clienteId, yo }: {
  mensajes: Mensaje[]; colaboradorId: string; clienteId: string | null; yo: "colaborador" | "delegado";
}) {
  return (
    <div className="flex h-full flex-col">
      <ol className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensajes.length === 0 && <li className="text-sm text-navy/60">Todavía no hay mensajes en esta conversación.</li>}
        {mensajes.map((m) => {
          const mio = m.remitente === yo;
          return (
            <li key={m.id} className={cx("max-w-[85%] rounded-xl px-3.5 py-2 text-sm", m.remitente === "sistema" ? "mx-auto bg-ambar-50 text-[#6b4700]" : mio ? "ml-auto bg-navy text-white" : "bg-white ring-1 ring-navy/10")}>
              <p className="whitespace-pre-wrap">{m.texto}</p>
              <p className={cx("mt-1 text-[11px]", mio && m.remitente !== "sistema" ? "text-white/60" : "text-navy/50")}>
                {m.remitente === "sistema" ? "Aviso automático" : m.remitente === "delegado" ? "INER" : "Colaborador"} · {fechaHora(m.fecha)}
              </p>
            </li>
          );
        })}
      </ol>
      <form action={enviarMensaje} className="flex gap-2 border-t border-navy/10 bg-white p-3">
        <input type="hidden" name="colaborador_id" value={colaboradorId} />
        <input type="hidden" name="cliente_id" value={clienteId ?? ""} />
        <label className="sr-only" htmlFor="texto">Mensaje</label>
        <textarea id="texto" name="texto" required rows={2} maxLength={5000} className="input resize-none" placeholder="Escribe un mensaje" />
        <Submit className="btn-verde" pendiente="Enviando…">Enviar</Submit>
      </form>
    </div>
  );
}

export type ResumenHilo = { clave: string; id: string | null; titulo: string; ultimo: Mensaje; noLeidos: number };

/** Agrupa mensajes (ya ordenados de más reciente a más antiguo) por cliente; null = conversación general.
 *  `recibido(m)` indica si el mensaje es para el usuario actual (para contar no leídos). */
export function agruparHilos(mensajes: Mensaje[], clientes: { id: string; nombre: string }[], recibido: (m: Mensaje) => boolean): ResumenHilo[] {
  const nombre = new Map(clientes.map((c) => [c.id, c.nombre]));
  const mapa = new Map<string, ResumenHilo>();
  for (const m of mensajes) {
    const clave = m.cliente_id ?? "general";
    let h = mapa.get(clave);
    if (!h) {
      h = { clave, id: m.cliente_id, titulo: m.cliente_id ? nombre.get(m.cliente_id) ?? "Cliente" : "Conversación general", ultimo: m, noLeidos: 0 };
      mapa.set(clave, h);
    }
    if (!m.leido && recibido(m)) h.noLeidos++;
  }
  return [...mapa.values()];
}
