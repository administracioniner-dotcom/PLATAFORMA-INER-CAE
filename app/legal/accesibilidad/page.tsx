import type { Metadata } from "next";
import { Documento } from "@/components/legal/Documento";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Accesibilidad · Portal INER" };

export default function Accesibilidad() {
  return (
    <Documento titulo="Accesibilidad">
      <h2>Introducción</h2>
      <p>{LEGAL.razonSocial} se ha comprometido a hacer accesible este portal, de modo que cualquier persona pueda usarlo, también quienes navegan con teclado o con lector de pantalla o tienen dificultades de visión. Esta declaración se aplica al portal de colaboradores y clientes de INER.</p>

      <h2>Qué hemos tenido en cuenta</h2>
      <ul>
        <li>Se puede navegar con el teclado y el foco se ve en todos los controles.</li>
        <li>Los campos de formulario tienen etiqueta y los mensajes de error se anuncian.</li>
        <li>Colores con contraste suficiente y textos que se pueden ampliar sin perder contenido.</li>
        <li>Diseño adaptado a móvil, tableta y ordenador.</li>
        <li>Las animaciones se reducen o desaparecen si tu dispositivo lo pide.</li>
      </ul>

      <h2>Situación de cumplimiento</h2>
      <p>Tomamos como referencia la norma UNE-EN 301549 y las pautas WCAG 2.1 de nivel AA. El portal es <b>parcialmente conforme</b>: todavía no se ha hecho una auditoría externa y puede haber contenidos que no las cumplan del todo, por ejemplo alguna alternativa textual incorrecta, algún enlace cuya función no esté bien definida o fallos puntuales de edición.</p>

      <h2>Contacto</h2>
      <p>Si algo no te funciona o necesitas la información en otro formato, escríbenos a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> o llama al {LEGAL.telefono}. Indica qué página y qué dificultad has tenido, y lo revisaremos.</p>
    </Documento>
  );
}
