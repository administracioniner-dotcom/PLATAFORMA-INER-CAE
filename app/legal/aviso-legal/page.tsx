import type { Metadata } from "next";
import { Documento } from "@/components/legal/Documento";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Aviso legal · Portal INER" };

export default function AvisoLegal() {
  return (
    <Documento titulo="Aviso legal">
      <h2>1. Titular del sitio</h2>
      <p>En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:</p>
      <ul>
        <li>Denominación social: {LEGAL.razonSocial}</li>
        <li>NIF: {LEGAL.nif}</li>
        <li>Domicilio: {LEGAL.domicilio}</li>
        <li>Correo electrónico: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></li>
        <li>Teléfono: {LEGAL.telefono}</li>
        <li>Inscripción registral: {LEGAL.registro}</li>
      </ul>

      <h2>2. Objeto y acceso</h2>
      <p>Este sitio es el portal privado de INER para colaboradores, clientes y personal de INER. Permite seguir el estado de los expedientes de certificados de ahorro energético (CAE), consultar la documentación pendiente y gestionar comunicaciones y pagos relacionados.</p>
      <p>El acceso está restringido a las personas a las que INER ha dado de alta. Las credenciales son personales e intransferibles: cada persona es responsable de custodiarlas y de lo que se haga con ellas. Si sospechas que otra persona las conoce, avisa a INER para cambiarlas.</p>

      <h2>3. Condiciones de uso</h2>
      <p>Quien accede se compromete a hacer un uso lícito del portal y a no intentar acceder a información de otras personas, alterar su funcionamiento ni sortear sus medidas de seguridad. INER puede suspender una cuenta ante un uso indebido o por razones de seguridad.</p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>El diseño, el código, los textos, el logotipo y demás elementos del portal pertenecen a INER o a sus licenciantes. No se permite su reproducción, distribución o transformación sin autorización expresa.</p>

      <h2>5. Responsabilidad</h2>
      <p>INER procura que la información del portal sea correcta y esté actualizada, pero no garantiza la ausencia de errores ni la disponibilidad ininterrumpida del servicio, que puede interrumpirse por mantenimiento o causas ajenas a INER. La información del portal tiene carácter informativo y no sustituye a lo acordado en los contratos entre las partes.</p>

      <h2>6. Protección de datos y cookies</h2>
      <p>El tratamiento de datos personales se explica en la <a href="/legal/privacidad">Política de privacidad</a> y el uso de cookies en la <a href="/legal/cookies">Política de cookies</a>.</p>

      <h2>7. Legislación aplicable</h2>
      <p>Este aviso se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a la normativa vigente.</p>
    </Documento>
  );
}
