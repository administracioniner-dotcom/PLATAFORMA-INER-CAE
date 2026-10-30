export const FASES = ["Cálculo de CAEs", "Contrato aceptado", "Fase verificador", "Fase MITECO", "CAE expedido"] as const;
export const VALOR_MWH = 100; // 1 CAE = 1 kWh -> 100 €/MWh. Solo se usa en vistas de equipo.
export const eur = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", useGrouping: "always" }).format(n);
/** Euros sin decimales, para cifras grandes de indicadores. */
export const eur0 = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" }).format(n);
export const num = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-ES", { maximumFractionDigits: 3 }).format(n);
export const fecha = (s: string | null) =>
  s ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(s)) : "—";
export const fechaHora = (s: string) =>
  new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(s));
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** Color de cada fase: degradado de la marca mientras se tramita y verde-azulado cuando el CAE está expedido. */
export const FASE_COLOR = ["#EA5409", "#EE6A0A", "#F2820A", "#F69A0A", "#0EA394"] as const;
export const iniciales = (n: string) => n.split(/[\s@.·]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
export const primerNombre = (n: string) => n.split(/[\s@]/)[0];

/** Últimos `n` meses (el actual incluido) con su clave AAAA-MM y su etiqueta corta. */
export function ultimosMeses(n = 6, hoy = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - (n - 1 - i), 1));
    return { clave: d.toISOString().slice(0, 7), etiqueta: new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "UTC" }).format(d).replace(".", "") };
  });
}
export const claveMes = (iso: string | null) => (iso ? iso.slice(0, 7) : "");
