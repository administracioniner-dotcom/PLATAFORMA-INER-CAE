/**
 * Datos del responsable que aparecen en las páginas legales. Se completan en un solo sitio.
 * `borrador` muestra un aviso en las páginas hasta que un asesor legal revise los textos: ponerlo en false al publicarlos.
 */
export const LEGAL = {
  borrador: true,
  razonSocial: "[Razón social de INER]",
  nif: "[NIF]",
  registro: "[Datos de inscripción en el Registro Mercantil]",
  domicilio: "Parque Científico y Tecnológico de Albacete, Pase de la Innovación, 3 · Edificio 4, Módulo 6 · 02006 Albacete",
  email: "info@iner.es",
  telefono: "+34 900 84 84 02",
  /** Correo para ejercer derechos de protección de datos. */
  emailPrivacidad: "info@iner.es",
  actualizado: "26 de noviembre de 2026",
} as const;

export const ENLACES_LEGALES = [
  { href: "/legal/aviso-legal", texto: "Aviso legal" },
  { href: "/legal/privacidad", texto: "Política de privacidad" },
  { href: "/legal/cookies", texto: "Política de cookies" },
  { href: "/legal/accesibilidad", texto: "Accesibilidad" },
] as const;
