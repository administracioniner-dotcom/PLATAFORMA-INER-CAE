import { Perfil } from "@/components/vistas/Perfil";
import { requireColaborador } from "@/lib/auth";
import { eur0 } from "@/lib/utils";
import type { ClienteColab } from "@/lib/types";

export default async function MiPerfil() {
  const { supabase, profile } = await requireColaborador();
  const { data } = await supabase.from("mis_clientes").select("comision,pago");
  const cs = (data ?? []) as Pick<ClienteColab, "comision" | "pago">[];
  const cobrado = cs.filter((c) => c.pago === "paid").reduce((a, c) => a + (c.comision ?? 0), 0);
  return <Perfil nombre={profile.nombre} email={profile.email} rol="Colaborador" desde={profile.created_at}
    datos={[{ etiqueta: "Clientes que nos has pasado", valor: String(cs.length) }, { etiqueta: "Ya cobrado", valor: eur0(cobrado), tono: "batt" }, { etiqueta: "Pagos solicitados", valor: String(cs.filter((c) => c.pago === "requested").length), tono: "net" }]} />;
}
