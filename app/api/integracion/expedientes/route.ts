import { createServiceClient } from "@/lib/supabase/server";
import { MAX_CUERPO, claveConfigurada, claveValida, extraerLote, validarExpediente, type EntradaExpediente } from "@/lib/integracion";

export const dynamic = "force-dynamic";

/** Fase en la que nace el cliente: la primera («Cálculo de CAEs», índice 0). Luego se mueve a mano en la plataforma. */
const FASE_INICIAL = 0;

const json = (cuerpo: unknown, estado = 200) =>
  Response.json(cuerpo, { status: estado, headers: { "Cache-Control": "no-store" } });

type Resultado = {
  origenId: string | null;
  resultado: "se_crearia" | "rechazado";
  destino?: "mis_clientes" | "colaborador";
  fase?: number;
  ficha?: { codigo: string; nombre: string };
  duplicado?: string;
  errores?: string[];
};

/**
 * Recibe expedientes de Expedientes CAE (Centro de control).
 *
 * PASO 2 DEL PLAN: SOLO SIMULACIÓN. Esta ruta valida y responde qué crearía, pero no escribe nada en la base de datos:
 * no hay ninguna orden de inserción ni de actualización en este fichero. La escritura llegará en su propio paso,
 * detrás de un interruptor aparte, y después de aplicar el cambio de base de datos (columna de origen).
 *
 * Seguridad: no usa la sesión de la plataforma (el middleware deja pasar /api/integracion) y se protege con una clave
 * compartida en INTEGRACION_SECRETO. Sin clave configurada responde 503 y no acepta nada.
 */
export async function POST(req: Request) {
  if (!claveConfigurada(process.env.INTEGRACION_SECRETO)) return json({ error: "Entrada no configurada." }, 503);
  if (!claveValida(req.headers.get("authorization"), process.env.INTEGRACION_SECRETO)) return json({ error: "No autorizado." }, 401);

  const largo = Number(req.headers.get("content-length") ?? 0);
  if (largo > MAX_CUERPO) return json({ error: "Petición demasiado grande." }, 413);
  let cuerpo: unknown;
  try {
    const texto = await req.text();
    if (texto.length > MAX_CUERPO) return json({ error: "Petición demasiado grande." }, 413);
    cuerpo = JSON.parse(texto);
  } catch {
    return json({ error: "El cuerpo no es JSON válido." }, 400);
  }
  const lote = extraerLote(cuerpo);
  if (!lote.ok) return json({ error: lote.error }, lote.estado);

  const validados = lote.items.map(validarExpediente);
  const buenos = validados.flatMap((v) => (v.ok ? [v.valor] : []));

  // Lecturas, nunca escrituras: qué fichas y colaboradores existen de verdad.
  const fichas = new Map<string, { codigo: string; nombre: string }[]>();
  const colaboradores = new Set<string>();
  try {
    const supabase = createServiceClient();
    const codigos = [...new Set(buenos.map((e) => e.ficha))];
    if (codigos.length) {
      const { data, error } = await supabase.from("fichas_tipo").select("codigo,nombre").in("codigo", codigos);
      if (error) throw error;
      for (const f of data ?? []) fichas.set(f.codigo, [...(fichas.get(f.codigo) ?? []), f]);
    }
    const ids = [...new Set(buenos.flatMap((e) => (e.colaboradorId ? [e.colaboradorId] : [])))];
    if (ids.length) {
      const { data, error } = await supabase.from("profiles").select("id").eq("rol", "colaborador").in("id", ids);
      if (error) throw error;
      for (const p of data ?? []) colaboradores.add(String(p.id).toLowerCase());
    }
  } catch (e) {
    console.error("integracion/expedientes", e);
    return json({ error: "No se pudo comprobar con la base de datos." }, 502);
  }

  const vistos = new Set<string>();
  const resultados: Resultado[] = validados.map((v) => {
    if (!v.ok) return { origenId: v.origenId, resultado: "rechazado", errores: v.errores };
    const e: EntradaExpediente = v.valor;
    const errores: string[] = [];
    if (vistos.has(e.origenId)) errores.push("origenId repetido en esta misma llamada.");
    vistos.add(e.origenId);
    const f = fichas.get(e.ficha);
    if (!f) errores.push(`ficha: no existe ningún tipo de ficha con el código «${e.ficha}».`);
    else if (f.length > 1) errores.push(`ficha: el código «${e.ficha}» lo comparten varios tipos de ficha.`);
    if (e.colaboradorId && !colaboradores.has(e.colaboradorId)) errores.push("colaboradorId: no corresponde a ningún colaborador.");
    if (errores.length) return { origenId: e.origenId, resultado: "rechazado", errores };
    return {
      origenId: e.origenId,
      resultado: "se_crearia",
      destino: e.colaboradorId ? "colaborador" : "mis_clientes",
      fase: FASE_INICIAL,
      ficha: f![0],
      // Hasta que exista la columna de origen (paso 3) no se puede saber si ya se creó antes.
      duplicado: "no comprobado: falta la columna de origen (paso 3 del plan)",
    };
  });

  const seCrearian = resultados.filter((r) => r.resultado === "se_crearia").length;
  return json({
    simulacion: true,
    nota: "No se ha escrito nada en la base de datos.",
    resumen: { recibidos: resultados.length, seCrearian, rechazados: resultados.length - seCrearian },
    resultados,
  });
}
