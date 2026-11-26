/**
 * Datos del responsable que aparecen en las páginas legales. Se completan en un solo sitio.
 * `borrador` muestra un aviso en las páginas hasta que un asesor legal revise los textos: ponerlo en false al publicarlos.
 */
export const LEGAL = {
  borrador: false,
  // Datos tomados de iner.es (Aviso legal y Política de privacidad).
  razonSocial: "INER SMART ENERGY SYSTEMS, S.L.",
  nif: "B02614337",
  registro: "Registro Mercantil de Albacete, tomo 890, libro 654, folio 85",
  domicilio: "Parque Científico Tecnológico de CLM, Paseo de la Innovación, 3, Edificio 4, Módulo 8, 02006 Albacete",
  email: "info@iner.es",
  telefono: "900 848 402",
  /** Correo para ejercer derechos de protección de datos. */
  emailPrivacidad: "info@iner.es",
  actualizado: "26 de noviembre de 2026",
  web: "iner.es",
} as const;

export const ENLACES_LEGALES = [
  { href: "/legal/aviso-legal", texto: "Aviso legal" },
  { href: "/legal/privacidad", texto: "Política de privacidad" },
  { href: "/legal/cookies", texto: "Política de cookies" },
  { href: "/legal/accesibilidad", texto: "Accesibilidad" },
] as const;
