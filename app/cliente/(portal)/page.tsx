import { ProyectoVista } from "@/components/vistas/ProyectoVista";
import { requireCliente } from "@/lib/auth";
import type { ClienteDirecto, FichaDoc, FichaTipo, MarcaDoc, ObsFase } from "@/lib/types";

export default async function MiProyecto() {
  const { supabase, profile } = await requireCliente();
  // Las políticas de la base de datos solo dejan ver al cliente su propio expediente.
  const { data: c } = await supabase.from("clientes_directos").select("id,nombre,ficha_id,mwh,precio_mwh,fase,cobrado_at,created_at,usuario_id,email").maybeSingle();
  if (!c) {
    return (
      <div className="mx-auto max-w-xl tarjeta p-8 text-center">
        <h1 className="text-2xl font-bold">Todavía no tenemos tu proyecto aquí</h1>
        <p className="mt-2 text-muted">Escríbenos a <a className="font-semibold text-ink underline" href="mailto:info@iner.es">info@iner.es</a> y lo revisamos.</p>
      </div>
    );
  }
  const cli = c as ClienteDirecto;
  const [{ data: ficha }, { data: docs }, { data: marcas }, { data: obs }] = await Promise.all([
    supabase.from("fichas_tipo").select("id,codigo,nombre").eq("id", cli.ficha_id).maybeSingle(),
    supabase.from("fichas_documento").select("id,ficha_id,grupo,nombre,ayuda,depende_de,aviso_anios,orden,aporta").eq("ficha_id", cli.ficha_id).order("orden"),
    supabase.from("clientes_directos_docs").select("cliente_id,documento_id,listo,fecha").eq("cliente_id", cli.id),
    supabase.from("clientes_directos_obs").select("id,cliente_id,fase,texto,created_at").eq("cliente_id", cli.id).order("created_at"),
  ]);
  const listos = new Set(((marcas ?? []) as MarcaDoc[]).filter((m) => m.listo).map((m) => m.documento_id));
  const mios = ((docs ?? []) as FichaDoc[]).filter((d) => d.aporta === "cliente").map((d) => ({ id: d.id, nombre: d.nombre, ayuda: d.ayuda, listo: listos.has(d.id), grupo: d.grupo }));
  const f2 = ficha as FichaTipo | null;
  return <ProyectoVista nombre={profile.nombre ?? cli.nombre} cli={cli} ficha={f2} mios={mios} obs={(obs ?? []) as ObsFase[]} />;
}
