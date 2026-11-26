import type { Metadata } from "next";
import { Documento } from "@/components/legal/Documento";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Aviso legal · Portal INER" };

export default function AvisoLegal() {
  return (
    <Documento titulo="Aviso legal">
      <h2>1. Quiénes somos</h2>
      <p>En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de que este portal pertenece a:</p>
      <ul>
        <li>Denominación social: {LEGAL.razonSocial} (en adelante, «INER»)</li>
        <li>CIF: {LEGAL.nif}</li>
        <li>Domicilio: {LEGAL.domicilio}</li>
        <li>Inscripción: {LEGAL.registro}</li>
        <li>Correo electrónico: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></li>
        <li>Teléfono: {LEGAL.telefono}</li>
      </ul>

      <h2>2. Objeto y acceso</h2>
      <p>Este sitio es el portal privado de INER para colaboradores, clientes y personal de INER. Permite seguir el estado de los expedientes de certificados de ahorro energético (CAE), consultar la documentación pendiente y gestionar comunicaciones y pagos relacionados.</p>
      <p>El acceso está restringido a las personas mayores de edad a las que INER ha dado de alta y se hace con una cuenta personal. INER puede limitar o suspender el acceso al portal y a sus servicios.</p>

      <h2>3. Condiciones de uso</h2>
      <p>La persona usuaria se obliga a cumplir estas condiciones y a obrar siempre conforme a la ley, a las buenas costumbres y a las exigencias de la buena fe, con la diligencia adecuada al servicio del que disfruta. Se abstendrá de utilizar el portal de cualquier forma que pueda impedir, dañar o deteriorar su normal funcionamiento, o los bienes o derechos de INER, de otras personas usuarias o de terceros, y de intentar acceder a información de otras personas o sortear las medidas de seguridad.</p>
      <p>Los contenidos y servicios del portal no podrán utilizarse para actividades ilícitas o contrarias al orden público.</p>
      <p>Quien se registra debe aportar información veraz y lícita. Si se le facilita una identificación y una contraseña, se compromete a hacer un uso diligente de ellas y a mantener la contraseña en secreto: es responsable de su custodia y confidencialidad y no debe cederlas a terceros, ni de forma temporal ni permanente. Si sospecha que otra persona las conoce, debe avisar a INER cuanto antes para cambiarlas.</p>
      <p>El uso del portal implica la aceptación de este Aviso legal en la versión publicada en el momento del acceso.</p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>Los derechos de propiedad intelectual e industrial del portal, su diseño gráfico y su código, así como los nombres comerciales, marcas y signos distintivos, son titularidad de INER, salvo que se indique que pertenecen a otro titular. No se permite su reproducción, distribución o transformación sin autorización expresa.</p>

      <h2>5. Exclusión de garantías y responsabilidad</h2>
      <p>El acceso y el uso del portal se realizan bajo la exclusiva responsabilidad de la persona usuaria. INER procura que la información sea correcta y esté actualizada, pero no garantiza la ausencia de errores ni se responsabiliza de los daños y perjuicios derivados de la falta de continuidad del funcionamiento del portal (por mantenimiento o causas ajenas a INER), ni de la presencia de virus o programas dañinos en el equipo de la persona usuaria o en servicios de terceros. La información del portal es orientativa y no sustituye a lo acordado en los contratos entre las partes.</p>

      <h2>6. Protección de datos y cookies</h2>
      <p>El tratamiento de datos personales se explica en la <a href="/legal/privacidad">Política de privacidad</a> y el uso de cookies en la <a href="/legal/cookies">Política de cookies</a>.</p>

      <h2>7. Legislación aplicable</h2>
      <p>Este aviso se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a la normativa vigente.</p>
    </Documento>
  );
}
