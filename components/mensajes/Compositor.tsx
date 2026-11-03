"use client";
import { useRef, useState, useTransition } from "react";
import { enviarMensaje } from "@/app/actions";
import { avisar } from "@/lib/avisar";

export type Sugerencia = { etiqueta: string; relleno: string };

/** Caja de escribir: Intro envía y Mayús + Intro salta de línea (en el móvil, Intro salta de línea). Crece al escribir. */
export function Compositor({ colaboradorId, clienteId, sugerencias = [], rotulo = "Sugerencias", placeholder }: {
  colaboradorId: string; clienteId: string | null; sugerencias?: Sugerencia[]; rotulo?: string; placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pendiente, empezar] = useTransition();
  const [vacio, setVacio] = useState(true);

  function ajustar() {
    const t = ref.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 130)}px`;
    setVacio(t.value.trim() === "");
  }
  function enviar() {
    const t = ref.current;
    const texto = t?.value.trim();
    if (!t || !texto || pendiente) return;
    const fd = new FormData();
    fd.set("colaborador_id", colaboradorId);
    fd.set("cliente_id", clienteId ?? "");
    fd.set("texto", texto);
    empezar(async () => {
      const r = await enviarMensaje(fd);
      if (r?.error) { avisar(r.error, "error"); return; } // el texto se queda en la caja: no se pierde
      t.value = "";
      ajustar();
      t.focus();
    });
  }
  function rellenar(texto: string) {
    const t = ref.current;
    if (!t) return;
    t.value = texto;
    ajustar();
    t.focus();
    t.setSelectionRange(texto.length, texto.length);
  }

  return (
    <div className="space-y-2 border-t border-line bg-panel p-3">
      {sugerencias.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-xs text-faint">{rotulo}</span>
          {sugerencias.map((s) => (
            <button key={s.etiqueta} type="button" onClick={() => rellenar(s.relleno)}
              className="rounded-full border border-line bg-soft px-3 py-0.5 text-xs font-semibold transition hover:border-ink">{s.etiqueta}</button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <label className="sr-only" htmlFor="texto-mensaje">Mensaje</label>
        <textarea ref={ref} id="texto-mensaje" rows={1} maxLength={5000} placeholder={placeholder} onInput={ajustar}
          className="input max-h-32 min-h-[2.6rem] flex-1 resize-none !rounded-2xl !py-2.5 leading-snug"
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
            if (window.matchMedia("(pointer: coarse)").matches) return; // en el móvil, Intro es un salto de línea
            e.preventDefault();
            enviar();
          }} />
        <button type="button" onClick={enviar} disabled={vacio || pendiente} aria-label={pendiente ? "Enviando" : "Enviar mensaje"}
          className="btn btn-primary !h-[2.6rem] !w-[2.6rem] shrink-0 !rounded-full !p-0 text-lg">{pendiente ? "…" : "➤"}</button>
      </div>
      <p className="hidden text-[11px] text-faint md:block">Intro envía · Mayús + Intro, salto de línea</p>
    </div>
  );
}
