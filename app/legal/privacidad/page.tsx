import type { Metadata } from "next";
import { Documento } from "@/components/legal/Documento";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de privacidad · Portal INER" };

export default function Privacidad() {
  return (
    <Documento titulo="Política de privacidad">
      <p>Esta política se aplica al tratamiento de datos personales que realiza {LEGAL.razonSocial} (en adelante, «INER») en este portal, en cumplimiento del Reglamento (UE) 2016/679 (RGPD), la Ley Orgánica 3/2018 (LOPDGDD) y la Ley 34/2002 (LSSI-CE).</p>

      <h2>1. ¿Quién es el responsable del tratamiento?</h2>
      <ul>
        <li>{LEGAL.razonSocial}, con CIF {LEGAL.nif}</li>
        <li>Domicilio: {LEGAL.domicilio}</li>
        <li>Inscripción: {LEGAL.registro}</li>
        <li>Contacto para dudas sobre tus datos: <a href={`mailto:${LEGAL.emailPrivacidad}`}>{LEGAL.emailPrivacidad}</a> · {LEGAL.telefono}</li>
      </ul>
      <p>INER garantiza la seguridad y el tratamiento confidencial de los datos que se le facilitan.</p>

      <h2>2. ¿Qué datos tratamos?</h2>
      <ul>
        <li><b>Datos de la cuenta:</b> nombre, correo electrónico, tipo de cuenta y contraseña (se guarda cifrada y INER no puede verla).</li>
        <li><b>Datos de los expedientes:</b> nombre o razón social del cliente, tipo de actuación, fase del expediente, MWh, importes, estado de pago, documentos marcados como entregados y observaciones del equipo.</li>
        <li><b>Mensajes</b> entre colaboradores y el equipo de INER.</li>
        <li><b>Datos técnicos y de seguridad:</b> registro de operaciones sensibles (altas, bajas, cambios de contraseña, borrados), intentos fallidos de acceso con su dirección IP y, para administradores, el factor de verificación en dos pasos.</li>
      </ul>
      <p>Los datos los aporta la propia persona usuaria, los genera la tramitación del expediente o los facilita el colaborador que presenta al cliente. Quien facilita datos de terceros garantiza que está autorizado para ello y que ha informado a esas personas.</p>

      <h2>3. ¿Con qué finalidad y legitimación?</h2>
      <ul>
        <li><b>Crear y gestionar tu acceso</b> al portal y gestionar la relación contractual. Legitimación: es imprescindible para la ejecución del contrato (art. 6.1.b RGPD).</li>
        <li><b>Tramitar los expedientes de CAE,</b> informar de su estado y gestionar comisiones y pagos. Legitimación: ejecución del contrato (art. 6.1.b).</li>
        <li><b>Atender consultas y solicitudes de información</b> y enviar avisos por correo sobre mensajes nuevos. Legitimación: ejecución del contrato (art. 6.1.b).</li>
        <li><b>Cumplir obligaciones contables, legales, fiscales y administrativas.</b> Legitimación: obligación legal (art. 6.1.c).</li>
        <li><b>Proteger el portal</b> frente a accesos indebidos y poder investigar incidentes. Legitimación: interés legítimo de INER en la seguridad de sus sistemas (art. 6.1.f).</li>
      </ul>
      <p>No usamos estos datos para enviarte publicidad ni para elaborar perfiles, y no tomamos decisiones automatizadas.</p>
      <p>El alta de la cuenta requiere ser mayor de edad: al darte de alta manifiestas que lo eres. Eres responsable de la veracidad de los datos que comunicas y debes pedirnos su modificación cuando cambien.</p>

      <h2>4. ¿Por cuánto tiempo los conservamos?</h2>
      <p>Tus datos se tratan mientras la relación con INER siga vigente, que termina cuando se cumplen todas las obligaciones derivadas de ella (por ejemplo, atender solicitudes de información, reclamaciones y revisión de pagos), sin perjuicio de las obligaciones de bloqueo y retención de datos que impone la normativa aplicable.</p>
      <p>Si no hay una relación vigente, los datos se conservan 2 años desde su recogida o desde la baja de la cuenta, también sin perjuicio de esas obligaciones legales.</p>

      <h2>5. ¿A quién se comunican tus datos?</h2>
      <p>INER trabaja con prestadores de servicios que pueden acceder a los datos, con las garantías necesarias, solo para la finalidad del tratamiento y bajo contrato como encargados del tratamiento:</p>
      <ul>
        <li><b>Supabase:</b> base de datos y autenticación. Los datos se alojan en la Unión Europea (Fráncfort).</li>
        <li><b>Vercel:</b> alojamiento de la aplicación web.</li>
        <li><b>Resend:</b> envío de los avisos por correo electrónico.</li>
      </ul>
      <p>Estos proveedores no pueden realizar acciones comerciales con tus datos ni comunicarlos a otras personas o entidades. Algunos pertenecen a grupos con sede fuera de la Unión Europea (Estados Unidos): esas transferencias internacionales se amparan en las garantías del RGPD, como las cláusulas contractuales tipo de la Comisión Europea. INER también puede ceder datos a las autoridades y organismos competentes, incluida la Administración Tributaria, cuando una ley lo exija.</p>

      <h2>6. ¿Cuáles son tus derechos?</h2>
      <p>Los datos que facilitas son necesarios para mantener la relación; si no los facilitas, no se puede gestionar. Puedes ejercer en cualquier momento estos derechos escribiendo a <a href={`mailto:${LEGAL.emailPrivacidad}`}>{LEGAL.emailPrivacidad}</a>, indicando cuál quieres ejercer y acreditando tu identidad:</p>
      <ul>
        <li>Acceso, rectificación y supresión de tus datos cuando ya no sean necesarios para los fines para los que se recogieron, entre otros motivos.</li>
        <li>Limitación del tratamiento en los casos del art. 18 RGPD: entonces solo se conservarán para ejercer o defender reclamaciones.</li>
        <li>Oposición al tratamiento y retirada del consentimiento, si lo hubieras dado, sin que afecte a la licitud del tratamiento anterior.</li>
        <li>Portabilidad: recibir una copia electrónica de tus datos.</li>
        <li>Impugnar cualquier decisión basada únicamente en un tratamiento automatizado que te afecte. Hoy INER no toma decisiones de ese tipo.</li>
      </ul>
      <p>Responderemos en el plazo legal de un mes. Si consideras que no hemos tratado tus datos correctamente, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>).</p>

      <h2>7. Medidas de seguridad</h2>
      <p>El acceso al portal se hace en un entorno seguro: comprueba que la dirección empieza por «https». INER ha adoptado las medidas técnicas y organizativas adecuadas para proteger los derechos y libertades de las personas y evitar la alteración, pérdida, tratamiento o acceso no autorizado a los datos: acceso solo con cuenta personal, permisos por perfil (cada persona solo ve lo suyo), conexiones cifradas, límite de intentos de acceso, registro de operaciones sensibles y verificación en dos pasos para administradores. Ten en cuenta que las medidas de seguridad en Internet no son inexpugnables.</p>

      <h2>8. Cambios en esta política</h2>
      <p>Si cambia el tratamiento de los datos, actualizaremos esta página y la fecha que figura arriba.</p>
    </Documento>
  );
}
