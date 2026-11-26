import type { Metadata } from "next";
import { Documento } from "@/components/legal/Documento";

export const metadata: Metadata = { title: "Política de cookies · Portal INER" };

export default function Cookies() {
  return (
    <Documento titulo="Política de cookies">
      <h2>1. Qué son</h2>
      <p>Una cookie es un pequeño archivo que el sitio guarda en tu dispositivo. Este portal solo usa las imprescindibles para funcionar.</p>

      <h2>2. Qué usamos</h2>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="bg-soft text-xs uppercase tracking-[.03em] text-muted">
            <tr><th className="p-3">Nombre</th><th className="p-3">Finalidad</th><th className="p-3">Tipo</th><th className="p-3">Duración</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr><td className="p-3 font-mono text-xs">sb-…-auth-token</td><td className="p-3">Mantiene tu sesión iniciada y comprueba quién eres en cada página.</td><td className="p-3">Técnica, propia</td><td className="p-3">Mientras dura la sesión; se renueva sola</td></tr>
            <tr><td className="p-3 font-mono text-xs">iner-mis-clientes</td><td className="p-3">Recuerda tus filtros y la vista elegida en «Mis clientes» (solo equipo de INER). Se guarda en el almacenamiento local del navegador.</td><td className="p-3">Técnica, propia</td><td className="p-3">Hasta que la borres</td></tr>
          </tbody>
        </table>
      </div>

      <h2>3. Qué no usamos</h2>
      <p>No usamos cookies de analítica, de publicidad ni de seguimiento, ni de terceros. Como solo usamos cookies técnicas necesarias para prestar el servicio que solicitas, están exentas de consentimiento (art. 22.2 de la LSSI-CE) y por eso no mostramos un aviso de aceptación.</p>

      <h2>4. Cómo borrarlas</h2>
      <p>Puedes eliminarlas o bloquearlas desde la configuración de tu navegador. Si bloqueas la cookie de sesión no podrás iniciar sesión en el portal.</p>

      <h2>5. Más información</h2>
      <p>El tratamiento de datos personales se explica en la <a href="/legal/privacidad">Política de privacidad</a>.</p>
    </Documento>
  );
}
