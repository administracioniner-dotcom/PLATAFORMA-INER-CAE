export const FASES = ["Cálculo de CAEs", "Contrato aceptado", "Fase verificador", "Gestor Autonómico", "Fase MITECO", "CAE expedido"] as const;
/** Índice de la última fase (CAE expedido): solo con ella se solicita o marca el pago. */
export const FASE_FINAL = FASES.length - 1;
export const VALOR_MWH = 100; // Precio habitual: 100 €/MWh. Cada cliente puede tener el suyo (clientes.precio_mwh).
/** Comisión del colaborador por un cliente: MWh × precio del cliente × % del colaborador. Solo para vistas de equipo. */
export const comisionDe = (c: { mwh: number | null; pct: number; precio_mwh?: number | null }) =>
  ((c.mwh ?? 0) * (c.precio_mwh ?? VALOR_MWH) * c.pct) / 100;
export const eur = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", useGrouping: "always" }).format(n);
/** Euros sin decimales, para cifras grandes de indicadores. */
export const eur0 = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" }).format(n);
export const num = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-ES", { maximumFractionDigits: 3 }).format(n);
/** Las fechas se muestran siempre en hora de España, también cuando las pinta el servidor (que está en UTC). */
const TZ = "Europe/Madrid";
export const fecha = (s: string | null) =>
  s ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ }).format(new Date(s)) : "—";
export const fechaHora = (s: string) =>
  new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(s));
export const hora = (s: string) => new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(s));
const claveDia = (d: Date) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TZ }).format(d);
export const diaClave = (s: string) => claveDia(new Date(s));
/** "Hoy", "Ayer" o el día de la semana con su fecha. */
export function etiquetaDia(s: string, ahora = new Date()) {
  const k = diaClave(s);
  if (k === claveDia(ahora)) return "Hoy";
  if (k === claveDia(new Date(ahora.getTime() - 864e5))) return "Ayer";
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(new Date(s));
}
/** Hora si es de hoy, "Ayer", el día de la semana si es de esta semana, o día y mes. */
export function fechaLista(s: string, ahora = new Date()) {
  const k = diaClave(s);
  if (k === claveDia(ahora)) return hora(s);
  if (k === claveDia(new Date(ahora.getTime() - 864e5))) return "Ayer";
  if (ahora.getTime() - new Date(s).getTime() < 6 * 864e5) return new Intl.DateTimeFormat("es-ES", { weekday: "short", timeZone: TZ }).format(new Date(s)).replace(/^./, (c) => c.toUpperCase());
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: TZ }).format(new Date(s));
}
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** Color de cada fase: degradado de la marca mientras se tramita y verde-azulado cuando el CAE está expedido. */
export const FASE_COLOR = ["#EA5409", "#EE6A0A", "#F2820A", "#F59A0A", "#F7B20C", "#0EA394"] as const;
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
