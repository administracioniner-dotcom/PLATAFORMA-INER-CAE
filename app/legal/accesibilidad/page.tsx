import type { Metadata } from "next";
import { Documento } from "@/components/legal/Documento";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Accesibilidad · Portal INER" };

export default function Accesibilidad() {
  return (
    <Documento titulo="Accesibilidad">
      <p>INER quiere que este portal pueda usarlo cualquier persona, también quienes navegan con teclado, con lectores de pantalla o con dificultades de visión.</p>

      <h2>Qué hemos tenido en cuenta</h2>
      <ul>
        <li>Se puede navegar con el teclado y el foco se ve en todos los controles.</li>
        <li>Los campos de formulario tienen etiqueta y los mensajes de error se anuncian.</li>
        <li>Colores con contraste suficiente y textos que se pueden ampliar sin perder contenido.</li>
        <li>Diseño adaptado a móvil, tableta y ordenador.</li>
        <li>Las animaciones se reducen o desaparecen si tu dispositivo lo pide.</li>
      </ul>

      <h2>Estado actual</h2>
      <p>Seguimos las pautas de accesibilidad de contenido web (WCAG 2.1, nivel AA) como objetivo. Todavía no se ha hecho una auditoría externa, así que puede haber partes que no las cumplan del todo.</p>

      <h2>Cuéntanos si encuentras un problema</h2>
      <p>Si algo no te funciona o necesitas la información en otro formato, escríbenos a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> o llama al {LEGAL.telefono}. Indica qué página y qué dificultad has tenido, y lo revisaremos.</p>
    </Documento>
  );
}
