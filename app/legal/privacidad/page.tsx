import type { Metadata } from "next";
import { Documento } from "@/components/legal/Documento";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de privacidad · Portal INER" };

export default function Privacidad() {
  return (
    <Documento titulo="Política de privacidad">
      <p>Esta política explica cómo trata INER los datos personales de quienes usan este portal, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD).</p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>Responsable: {LEGAL.razonSocial} (NIF {LEGAL.nif})</li>
        <li>Domicilio: {LEGAL.domicilio}</li>
        <li>Contacto para temas de protección de datos: <a href={`mailto:${LEGAL.emailPrivacidad}`}>{LEGAL.emailPrivacidad}</a></li>
      </ul>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li><b>Datos de la cuenta:</b> nombre, correo electrónico, tipo de cuenta y contraseña (esta última se guarda cifrada y INER no puede verla).</li>
        <li><b>Datos de los expedientes:</b> nombre o razón social del cliente, tipo de actuación, fase del expediente, MWh, importes, estado de pago, documentos marcados como entregados y observaciones del equipo.</li>
        <li><b>Mensajes</b> entre colaboradores y el equipo de INER.</li>
        <li><b>Datos técnicos y de seguridad:</b> registro de operaciones sensibles (altas, bajas, cambios de contraseña, borrados), intentos fallidos de acceso con su dirección IP y, para administradores, el factor de verificación en dos pasos.</li>
      </ul>
      <p>Los colaboradores pueden facilitarnos datos de sus propios clientes. Quien los facilita debe contar con una base que lo permita y haber informado a esas personas.</p>

      <h2>3. Para qué los usamos y con qué base legal</h2>
      <ul>
        <li>Crear y gestionar tu acceso al portal y atender tus consultas. Base: ejecución de la relación contractual o de medidas previas a ella (art. 6.1.b RGPD).</li>
        <li>Tramitar los expedientes de CAE, informar de su estado y gestionar comisiones y pagos. Base: ejecución del contrato (art. 6.1.b) y cumplimiento de obligaciones legales, fiscales y contables (art. 6.1.c).</li>
        <li>Enviar avisos por correo sobre mensajes nuevos. Base: ejecución del contrato (art. 6.1.b).</li>
        <li>Proteger el portal frente a accesos indebidos y poder investigar incidentes. Base: interés legítimo de INER en la seguridad de sus sistemas (art. 6.1.f).</li>
      </ul>
      <p>No tomamos decisiones automatizadas ni elaboramos perfiles con estos datos.</p>

      <h2>4. Cuánto tiempo los conservamos</h2>
      <p>Mientras dure la relación con INER y, después, durante los plazos necesarios para atender posibles responsabilidades y cumplir las obligaciones legales, fiscales y contables. Pasado ese tiempo se suprimen o se anonimizan. Los datos técnicos de seguridad se conservan solo el tiempo necesario para su finalidad.</p>

      <h2>5. A quién se comunican</h2>
      <p>INER no vende tus datos. Para prestar el servicio usamos proveedores que actúan como encargados del tratamiento bajo contrato:</p>
      <ul>
        <li><b>Supabase:</b> base de datos y autenticación. Los datos se alojan en la Unión Europea (Fráncfort).</li>
        <li><b>Vercel:</b> alojamiento de la aplicación web.</li>
        <li><b>Resend:</b> envío de los avisos por correo electrónico.</li>
      </ul>
      <p>Algunos de estos proveedores pertenecen a grupos con sede en Estados Unidos. Cuando hay transferencia internacional se ampara en las garantías del RGPD, como las cláusulas contractuales tipo de la Comisión Europea. También podemos comunicar datos a administraciones y organismos cuando una ley lo exija.</p>

      <h2>6. Tus derechos</h2>
      <p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a <a href={`mailto:${LEGAL.emailPrivacidad}`}>{LEGAL.emailPrivacidad}</a>, indicando el derecho que quieres ejercer y acreditando tu identidad. Responderemos en el plazo legal de un mes.</p>
      <p>Si consideras que no hemos tratado tus datos correctamente, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>).</p>

      <h2>7. Seguridad</h2>
      <p>Aplicamos medidas técnicas y organizativas adecuadas: acceso solo con cuenta personal, permisos por perfil (cada persona solo ve lo suyo), conexiones cifradas, límite de intentos de acceso, registro de operaciones sensibles y verificación en dos pasos para administradores.</p>

      <h2>8. Cambios en esta política</h2>
      <p>Si cambia el tratamiento de los datos, actualizaremos esta página y la fecha que figura arriba.</p>
    </Documento>
  );
}
