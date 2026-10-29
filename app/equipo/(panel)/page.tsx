import { ListaColaboradores, type FilaColab } from "@/components/vistas/ListaColaboradores";
import { AutoRefresh } from "@/components/AutoRefresh";
import { requireStaff } from "@/lib/auth";
import { VALOR_MWH } from "@/lib/utils";
import type { ClienteStaff, Profile } from "@/lib/types";

export default async function Colaboradores({ searchParams }: { searchParams: Promise<{ q?: string; f?: string }> }) {
  const { q = "", f = "todos" } = await searchParams;
  const { supabase, profile } = await requireStaff();
  const [{ data: ps }, { data: cs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("rol", "colaborador").order("nombre"),
    supabase.from("clientes").select("*").is("archivado_at", null),
  ]);
  const clientes = (cs ?? []) as ClienteStaff[];
  const comision = (c: ClienteStaff) => (c.mwh ?? 0) * VALOR_MWH * (c.pct / 100);
  const filas: FilaColab[] = ((ps ?? []) as Profile[]).map((p) => {
    const mios = clientes.filter((c) => c.colaborador_id === p.id);
    return {
      p, n: mios.length,
      pendientes: mios.filter((c) => c.pago === "requested").length,
      porCobrar: mios.filter((c) => c.fase === 4 && c.pago !== "paid").reduce((a, c) => a + comision(c), 0),
      valor: mios.reduce((a, c) => a + (c.mwh ?? 0) * VALOR_MWH, 0),
      porFase: [0, 1, 2, 3, 4].map((fase) => mios.filter((c) => c.fase === fase).length),
    };
  }).filter((r) => {
    const t = q.trim().toLowerCase();
    if (t && !(`${r.p.nombre ?? ""} ${r.p.email}`.toLowerCase().includes(t))) return false;
    if (f === "pendientes") return r.pendientes > 0;
    if (f === "invitados") return r.p.estado === "invitado";
    return true;
  });
  const tot = filas.reduce((a, r) => ({ n: a.n + r.n, pend: a.pend + r.pendientes, valor: a.valor + r.valor, porCobrar: a.porCobrar + r.porCobrar }), { n: 0, pend: 0, valor: 0, porCobrar: 0 });
  const conteos = [0, 1, 2, 3, 4].map((i) => filas.reduce((a, r) => a + r.porFase[i], 0));
  return (
    <>
      <AutoRefresh cada={30} />
      <ListaColaboradores filas={filas} tot={tot} conteos={conteos} q={q} f={f} esAdmin={profile.rol === "admin"} />
    </>
  );
}
