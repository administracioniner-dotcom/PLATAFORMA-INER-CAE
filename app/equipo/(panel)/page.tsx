import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { VALOR_MWH, cx, eur } from "@/lib/utils";
import type { ClienteStaff, Profile } from "@/lib/types";

const FILTROS = [["todos", "Todos"], ["pendientes", "Con pendientes"], ["invitados", "Invitados"]] as const;

export default async function Colaboradores({ searchParams }: { searchParams: Promise<{ q?: string; f?: string }> }) {
  const { q = "", f = "todos" } = await searchParams;
  const { supabase } = await requireStaff();
  const [{ data: ps }, { data: cs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("rol", "colaborador").order("nombre"),
    supabase.from("clientes").select("*").is("archivado_at", null),
  ]);
  const clientes = (cs ?? []) as ClienteStaff[];
  const filas = ((ps ?? []) as Profile[]).map((p) => {
    const mios = clientes.filter((c) => c.colaborador_id === p.id);
    const comision = (c: ClienteStaff) => (c.mwh ?? 0) * VALOR_MWH * (c.pct / 100);
    return {
      p, n: mios.length,
      pendientes: mios.filter((c) => c.pago === "requested").length,
      porCobrar: mios.filter((c) => c.fase === 4 && c.pago !== "paid").reduce((a, c) => a + comision(c), 0),
      valor: mios.reduce((a, c) => a + (c.mwh ?? 0) * VALOR_MWH, 0),
    };
  }).filter((r) => {
    const t = q.trim().toLowerCase();
    if (t && !(`${r.p.nombre ?? ""} ${r.p.email}`.toLowerCase().includes(t))) return false;
    if (f === "pendientes") return r.pendientes > 0;
    if (f === "invitados") return r.p.estado === "invitado";
    return true;
  });
  const tot = filas.reduce((a, r) => ({ n: a.n + r.n, pend: a.pend + r.pendientes, valor: a.valor + r.valor, porCobrar: a.porCobrar + r.porCobrar }), { n: 0, pend: 0, valor: 0, porCobrar: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Colaboradores</h1>
        <form className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="f" value={f} />
          <label className="sr-only" htmlFor="q">Buscar colaborador</label>
          <input id="q" name="q" defaultValue={q} placeholder="Buscar por nombre o correo" className="input w-64" />
          <button className="btn btn-ghost">Buscar</button>
        </form>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro">
        {FILTROS.map(([k, t]) => (
          <Link key={k} href={`/equipo?f=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={cx("rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1", f === k ? "bg-navy text-white ring-navy" : "bg-white ring-navy/15 hover:bg-navy-50")}>{t}</Link>
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Clientes activos", String(tot.n)], ["Pagos solicitados", String(tot.pend)], ["Valor CAE en curso", eur(tot.valor)], ["Comisión por pagar", eur(tot.porCobrar)]].map(([t, v]) => (
          <div key={t} className="rounded-xl bg-white p-4 ring-1 ring-navy/10"><dt className="text-xs text-navy/60">{t}</dt><dd className="mt-1 text-xl font-bold tabular-nums">{v}</dd></div>
        ))}
      </dl>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filas.length === 0 && <li className="col-span-full rounded-xl bg-white p-8 text-center text-navy/60 ring-1 ring-navy/10">No hay colaboradores con este filtro.</li>}
        {filas.map((r) => (
          <li key={r.p.id}>
            <Link href={`/equipo/colaboradores/${r.p.id}`} className="block rounded-xl bg-white p-4 ring-1 ring-navy/10 hover:ring-verde">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="truncate font-bold">{r.p.nombre ?? r.p.email}</p><p className="truncate text-xs text-navy/60">{r.p.email}</p></div>
                {r.p.estado === "invitado" && <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold">Invitado</span>}
                {r.pendientes > 0 && <span className="rounded-full bg-ambar px-2 py-0.5 text-xs font-bold">{r.pendientes} pago{r.pendientes > 1 ? "s" : ""}</span>}
              </div>
              <p className="mt-3 text-sm text-navy/70">{r.n} cliente{r.n === 1 ? "" : "s"} · por pagar <span className="font-semibold text-navy">{eur(r.porCobrar)}</span></p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
