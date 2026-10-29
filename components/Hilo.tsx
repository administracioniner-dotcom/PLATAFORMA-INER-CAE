import { AlFinal } from "@/components/AlFinal";
import { FormMensaje } from "@/components/FormMensaje";
import { cx, fechaHora } from "@/lib/utils";
import type { Mensaje } from "@/lib/types";

export function Hilo({ mensajes, colaboradorId, clienteId, yo }: {
  mensajes: Mensaje[]; colaboradorId: string; clienteId: string | null; yo: "colaborador" | "delegado";
}) {
  return (
    <div className="flex h-full flex-col">
      <ol className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
        {mensajes.length === 0 && <li className="m-auto max-w-xs text-center text-sm text-muted">Todavía no hay mensajes aquí. Escribe el primero.</li>}
        {mensajes.map((m) => {
          const mio = m.remitente === yo;
          const sistema = m.remitente === "sistema";
          return (
            <li key={m.id} className={cx("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", sistema ? "mx-auto bg-sun-50 text-sun-700" : mio ? "ml-auto rounded-br-md bg-brand text-ink" : "rounded-bl-md bg-panel shadow-card")}>
              <p className="whitespace-pre-wrap">{m.texto}</p>
              <p className={cx("mt-1 text-[11px]", mio && !sistema ? "text-ink/70" : "text-muted")}>
                {sistema ? "Aviso automático" : m.remitente === "delegado" ? "INER" : "Colaborador"} · {fechaHora(m.fecha)}
              </p>
            </li>
          );
        })}
        <AlFinal n={mensajes.length} />
      </ol>
      <FormMensaje colaboradorId={colaboradorId} clienteId={clienteId} />
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
