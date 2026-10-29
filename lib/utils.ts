export const FASES = ["Cálculo de CAEs", "Contrato aceptado", "Fase verificador", "Fase MITECO", "CAE expedido"] as const;
export const VALOR_MWH = 100; // 1 CAE = 1 kWh -> 100 €/MWh. Solo se usa en vistas de equipo.
export const eur = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
export const num = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-ES", { maximumFractionDigits: 3 }).format(n);
export const fecha = (s: string | null) =>
  s ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(s)) : "—";
export const fechaHora = (s: string) =>
  new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(s));
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
