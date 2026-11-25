"use client";
import { useState, useTransition } from "react";
import { confirmarDosPasos, empezarDosPasos, verificarDosPasos } from "@/app/actions";
import { FormEstado } from "@/components/FormEstado";
import { Submit } from "@/components/Submit";

function CampoCodigo() {
  return (
    <div>
      <label className="label" htmlFor="codigo">Código de 6 números</label>
      <input id="codigo" name="codigo" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus placeholder="000000"
        className="input text-center font-mono text-2xl tracking-[.35em]" />
    </div>
  );
}

/** Pedir el código al entrar, o activar los dos pasos con una aplicación de autenticación. */
export function DosPasos({ modo }: { modo: "pedir" | "activar" }) {
  const [reto, setReto] = useState<{ factorId: string; qr: string; secreto: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, empezar] = useTransition();

  if (modo === "pedir") {
    return (
      <FormEstado action={verificarDosPasos} className="space-y-4">
        <p className="text-sm text-muted">Abre tu aplicación de autenticación y escribe el código de <b className="text-ink">Portal INER</b>.</p>
        <CampoCodigo />
        <Submit className="btn-primary w-full !py-3" pendiente="Comprobando…">Entrar</Submit>
      </FormEstado>
    );
  }

  if (!reto) {
    return (
      <div className="space-y-4">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>Instala una aplicación de autenticación en tu móvil (Google Authenticator, Microsoft Authenticator, Authy o 1Password).</li>
          <li>Pulsa «Empezar» y escanea el código QR.</li>
          <li>Escribe el código de 6 números que te muestre la aplicación.</li>
        </ol>
        {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
        <button type="button" className="btn-primary w-full !py-3" disabled={cargando}
          onClick={() => empezar(async () => {
            setError(null);
            const r = await empezarDosPasos();
            if (r.error || !r.factorId || !r.qr || !r.secreto) setError(r.error ?? "No se pudo preparar la activación."); else setReto({ factorId: r.factorId, qr: r.qr, secreto: r.secreto });
          })}>{cargando ? "Preparando…" : "Empezar"}</button>
      </div>
    );
  }

  return (
    <FormEstado action={confirmarDosPasos} className="space-y-4">
      <input type="hidden" name="factor" value={reto.factorId} />
      <p className="text-sm text-muted">Escanea este código con tu aplicación de autenticación.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={reto.qr} alt="Código QR para la aplicación de autenticación" width={192} height={192} className="mx-auto rounded-xl border border-line bg-white p-2" />
      <details className="text-sm text-muted">
        <summary className="cursor-pointer font-semibold text-net-700">¿No puedes escanearlo? Escribe la clave a mano</summary>
        <p className="mt-2 select-all break-all rounded-lg bg-soft p-2.5 font-mono text-xs text-ink">{reto.secreto}</p>
      </details>
      <CampoCodigo />
      <Submit className="btn-primary w-full !py-3" pendiente="Comprobando…">Activar</Submit>
    </FormEstado>
  );
}
