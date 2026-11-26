import type { Metadata } from "next";
import { Documento } from "@/components/legal/Documento";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de cookies · Portal INER" };

export default function Cookies() {
  return (
    <Documento titulo="Política de cookies">
      <h2>1. Qué son</h2>
      <p>Las cookies son pequeños archivos que un sitio web guarda en tu navegador o dispositivo. Sirven para que la web funcione, para recordar tus preferencias o para obtener estadísticas de uso. Aquí usamos «cookies» también para tecnologías similares, como el almacenamiento local del navegador (localStorage). Este portal solo usa las imprescindibles para funcionar.</p>

      <h2>2. Responsable</h2>
      <p>El responsable es {LEGAL.razonSocial} (en adelante, «INER»), con CIF {LEGAL.nif} y domicilio en {LEGAL.domicilio}. Puedes contactarnos en <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> o en el {LEGAL.telefono}.</p>

      <h2>3. Base legal y consentimiento</h2>
      <p>Conforme al artículo 22.2 de la LSSI-CE, al RGPD y a la Guía sobre el uso de las cookies de la Agencia Española de Protección de Datos, las cookies técnicas o necesarias se usan sin necesidad de tu consentimiento porque son imprescindibles para prestarte el servicio que solicitas. Las analíticas, publicitarias y de terceros solo se instalarían con tu consentimiento previo; este portal no usa ninguna.</p>

      <h2>4. Cookies que utilizamos</h2>
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

      <h2>5. Qué no usamos</h2>
      <p>No usamos cookies de analítica, de publicidad ni de seguimiento, ni de terceros. Como solo usamos cookies técnicas necesarias, no mostramos un panel de aceptación. Esto es distinto de la web iner.es, que sí usa un panel de cookies porque emplea cookies de analítica.</p>

      <h2>6. Cómo borrarlas</h2>
      <p>Puedes eliminarlas o bloquearlas desde la configuración de tu navegador. Si bloqueas la cookie de sesión no podrás iniciar sesión en el portal.</p>

      <h2>7. Más información</h2>
      <p>El tratamiento de datos personales se explica en la <a href="/legal/privacidad">Política de privacidad</a>.</p>
    </Documento>
  );
}
