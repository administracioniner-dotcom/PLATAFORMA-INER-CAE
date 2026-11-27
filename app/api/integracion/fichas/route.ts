import { createServiceClient } from "@/lib/supabase/server";
import { claveConfigurada, claveValida } from "@/lib/integracion";

export const dynamic = "force-dynamic";

const json = (cuerpo: unknown, estado = 200) =>
  Response.json(cuerpo, { status: estado, headers: { "Cache-Control": "no-store" } });

/**
 * Lista los tipos de ficha (código y nombre) para que Expedientes CAE ofrezca el desplegable de «ficha» y
 * las dos listas no se desajusten. Solo lectura. Misma clave que la entrada de expedientes.
 */
export async function GET(req: Request) {
  if (!claveConfigurada(process.env.INTEGRACION_SECRETO)) return json({ error: "Entrada no configurada." }, 503);
  if (!claveValida(req.headers.get("authorization"), process.env.INTEGRACION_SECRETO)) return json({ error: "No autorizado." }, 401);
  try {
    const { data, error } = await createServiceClient().from("fichas_tipo").select("codigo,nombre").order("nombre");
    if (error) throw error;
    return json({ fichas: data ?? [] });
  } catch (e) {
    console.error("integracion/fichas", e);
    return json({ error: "No se pudo leer la lista de fichas." }, 502);
  }
}
