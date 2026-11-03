"use client";
import { useRef } from "react";

const CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generar(largo = 14) {
  const bytes = crypto.getRandomValues(new Uint32Array(largo));
  return Array.from(bytes, (b) => CARACTERES[b % CARACTERES.length]).join("");
}

export function CampoContrasena({ id = "password", compacto = false }: { id?: string; compacto?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className={compacto ? "sr-only" : "label"} htmlFor={id}>Contraseña</label>
      <div className="flex gap-2">
        <input ref={ref} id={id} name="password" type="text" required minLength={10} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} maxLength={72} className={compacto ? "input !bg-panel !py-1.5 font-mono" : "input font-mono"} placeholder="Mínimo 10 caracteres" />
        <button type="button" className={compacto ? "btn btn-ghost shrink-0 !px-4 !py-1.5" : "btn btn-ghost shrink-0"} onClick={() => { if (ref.current) ref.current.value = generar(); }}>Generar</button>
      </div>
      {!compacto && <p className="mt-1 text-xs text-muted">Cópiala y envíasela a la persona: no se vuelve a mostrar.</p>}
    </div>
  );
}
