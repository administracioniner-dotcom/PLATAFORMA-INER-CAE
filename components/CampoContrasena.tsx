"use client";
import { useRef } from "react";

const CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generar(largo = 14) {
  const bytes = crypto.getRandomValues(new Uint32Array(largo));
  return Array.from(bytes, (b) => CARACTERES[b % CARACTERES.length]).join("");
}

export function CampoContrasena() {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="label" htmlFor="password">Contraseña</label>
      <div className="flex gap-2">
        <input ref={ref} id="password" name="password" type="text" required minLength={10} autoComplete="off" className="input font-mono" placeholder="Mínimo 10 caracteres" />
        <button type="button" className="btn btn-ghost shrink-0" onClick={() => { if (ref.current) ref.current.value = generar(); }}>Generar</button>
      </div>
      <p className="mt-1 text-xs text-muted">Cópiala y envíasela a la persona: no se vuelve a mostrar.</p>
    </div>
  );
}
