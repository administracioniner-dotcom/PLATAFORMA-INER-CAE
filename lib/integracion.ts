import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Entrada de otras aplicaciones de INER (hoy, Expedientes CAE del Centro de control).
 * Sin dependencias de Next ni de Supabase para poder probarlo solo.
 */

/** Mismos límites que las pantallas de la plataforma (app/actions.ts). */
export const MAX_NOMBRE = 200;
export const MAX_MWH = 1_000_000;
export const MAX_NUMERO = 60;
/** Expedientes que se aceptan en una sola llamada. */
export const MAX_LOTE = 50;
/** Tamaño máximo del cuerpo de la petición, en bytes. */
export const MAX_CUERPO = 100_000;
export const MIN_CLAVE = 32;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_ORIGEN = /^[A-Za-z0-9_.-]{1,80}$/;
const CODIGO_FICHA = /^[A-Za-z0-9_.\- ]{1,60}$/;

/** True si hay una clave configurada y es lo bastante larga. Sin ella la entrada queda cerrada. */
export const claveConfigurada = (esperada: string | undefined): boolean => !!esperada && esperada.length >= MIN_CLAVE;

/** Compara la clave recibida (cabecera «Authorization: Bearer …») con la esperada, sin dar pistas por el tiempo que tarda. */
export function claveValida(cabecera: string | null, esperada: string | undefined): boolean {
  if (!claveConfigurada(esperada)) return false;
  const m = /^Bearer (.+)$/.exec(cabecera ?? "");
  if (!m) return false;
  const a = createHash("sha256").update(m[1]).digest();
  const b = createHash("sha256").update(esperada as string).digest();
  return timingSafeEqual(a, b);
}

export type EntradaExpediente = {
  /** Identificador estable del expediente en la aplicación de origen. Evitará duplicados cuando se escriba. */
  origenId: string;
  nombre: string;
  numero: string | null;
  mwh: number | null;
  /** Código del tipo de ficha (fichas_tipo.codigo). */
  ficha: string;
  /** Solo si el expediente tiene colaborador; si no, es un cliente directo de INER («Mis clientes»). */
  colaboradorId: string | null;
};

export type Validacion = { ok: true; valor: EntradaExpediente } | { ok: false; origenId: string | null; errores: string[] };

const esTexto = (v: unknown): v is string => typeof v === "string";
const limpio = (v: unknown): string => (esTexto(v) ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim() : "");

/** Valida un expediente recibido. Nunca lanza: devuelve los motivos del rechazo, uno por problema. */
export function validarExpediente(x: unknown): Validacion {
  const errores: string[] = [];
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;

  const origenId = esTexto(o.origenId) && ID_ORIGEN.test(o.origenId) ? o.origenId : null;
  if (!origenId) errores.push("origenId: obligatorio, solo letras, números, punto, guion y guion bajo (máximo 80).");

  const nombre = limpio(o.nombre);
  if (!nombre) errores.push("nombre: obligatorio.");
  else if (nombre.length > MAX_NOMBRE) errores.push(`nombre: no puede superar ${MAX_NOMBRE} caracteres.`);

  let numero: string | null = null;
  if (o.numero !== undefined && o.numero !== null && o.numero !== "") {
    numero = limpio(o.numero);
    if (!numero || numero.length > MAX_NUMERO) errores.push(`numero: hasta ${MAX_NUMERO} caracteres.`);
  }

  let mwh: number | null = null;
  if (o.mwh !== undefined && o.mwh !== null && o.mwh !== "") {
    if (typeof o.mwh !== "number" || !Number.isFinite(o.mwh) || o.mwh < 0 || o.mwh > MAX_MWH) errores.push("mwh: un número entre 0 y 1.000.000.");
    else mwh = o.mwh;
  }

  const ficha = esTexto(o.ficha) ? o.ficha.trim() : "";
  if (!ficha) errores.push("ficha: obligatoria. Sin ficha el expediente no se envía.");
  else if (!CODIGO_FICHA.test(ficha)) errores.push("ficha: código no válido.");

  let colaboradorId: string | null = null;
  if (o.colaboradorId !== undefined && o.colaboradorId !== null && o.colaboradorId !== "") {
    if (!esTexto(o.colaboradorId) || !UUID.test(o.colaboradorId)) errores.push("colaboradorId: debe ser un identificador válido.");
    else colaboradorId = o.colaboradorId.toLowerCase();
  }

  if (errores.length) return { ok: false, origenId, errores };
  return { ok: true, valor: { origenId: origenId as string, nombre, numero, mwh, ficha, colaboradorId } };
}

/** Comprueba la forma del cuerpo: { expedientes: [...] } con entre 1 y MAX_LOTE elementos. */
export function extraerLote(cuerpo: unknown): { ok: true; items: unknown[] } | { ok: false; estado: number; error: string } {
  const lista = cuerpo && typeof cuerpo === "object" ? (cuerpo as { expedientes?: unknown }).expedientes : undefined;
  if (!Array.isArray(lista) || lista.length === 0) return { ok: false, estado: 400, error: "Se esperaba { expedientes: [ … ] } con al menos un expediente." };
  if (lista.length > MAX_LOTE) return { ok: false, estado: 413, error: `Como máximo ${MAX_LOTE} expedientes por llamada.` };
  return { ok: true, items: lista };
}
