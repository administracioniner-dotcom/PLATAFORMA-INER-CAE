"use client";
import { useRef } from "react";
import { enviarMensaje } from "@/app/actions";
import { avisar } from "@/lib/avisar";
import { Submit } from "@/components/Submit";

export function FormMensaje({ colaboradorId, clienteId }: { colaboradorId: string; clienteId: string | null }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={async (fd) => {
      const r = await enviarMensaje(fd);
      if (r?.error) { avisar(r.error, "error"); return; } // no vacía el cuadro: el mensaje no se pierde
      ref.current?.reset();
    }} className="flex items-end gap-2 border-t border-line bg-panel p-3">
      <input type="hidden" name="colaborador_id" value={colaboradorId} />
      <input type="hidden" name="cliente_id" value={clienteId ?? ""} />
      <label className="sr-only" htmlFor="texto">Mensaje</label>
      <textarea id="texto" name="texto" required rows={2} maxLength={5000} className="input resize-none" placeholder="Escribe un mensaje (Ctrl + Intro para enviar)"
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ref.current?.requestSubmit(); } }} />
      <Submit className="btn-primary" pendiente="Enviando…">Enviar</Submit>
    </form>
  );
}
