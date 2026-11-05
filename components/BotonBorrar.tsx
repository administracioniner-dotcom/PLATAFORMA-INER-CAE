"use client";
import { useState } from "react";
import type { Estado } from "@/app/actions";
import { FormAviso } from "@/components/FormAviso";
import { Submit } from "@/components/Submit";

/** Botón de borrar en dos pasos: primero «Eliminar…», luego se explica qué se pierde y se confirma. */
export function BotonBorrar({ action, campos, aviso, boton = "Eliminar…", confirmar = "Sí, eliminar", pendiente = "Eliminando…" }: {
  action: (fd: FormData) => Promise<Estado | void>; campos: Record<string, string>; aviso: string; boton?: string; confirmar?: string; pendiente?: string;
}) {
  const [pidiendo, setPidiendo] = useState(false);
  if (!pidiendo) {
    return <button type="button" onClick={() => setPidiendo(true)} className="text-xs font-semibold text-red-700 underline underline-offset-2">{boton}</button>;
  }
  return (
    <FormAviso action={action} alTerminar={(bien) => !bien && setPidiendo(true)} className="space-y-1.5 rounded-lg border border-red-200 bg-red-50 p-2.5">
      {Object.entries(campos).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <p className="text-xs text-red-800">{aviso}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Submit className="whitespace-nowrap bg-red-700 !px-3 !py-1 text-xs text-white hover:bg-red-800" pendiente={pendiente}>{confirmar}</Submit>
        <button type="button" onClick={() => setPidiendo(false)} className="text-xs font-semibold text-muted underline underline-offset-2">No, conservar</button>
      </div>
    </FormAviso>
  );
}
