import Link from "next/link";
import { solicitarPago } from "@/app/actions";
import { Submit } from "@/components/Submit";
import { Fase } from "@/components/Fase";
import { requireColaborador } from "@/lib/auth";
import { eur, fecha, num } from "@/lib/utils";
import type { ClienteColab } from "@/lib/types";

export default async function MisClientes({ searchParams }: { searchParams: Promise<{ archivados?: string }> }) {
  const { archivados } = await searchParams;
  const verArchivados = archivados === "1";
  const { supabase, profile } = await requireColaborador();
  const { data } = await supabase.from("mis_clientes").select("*").order("created_at", { ascending: false });
  const todos = (data ?? []) as ClienteColab[];
  const activos = todos.filter((c) => !c.archivado_at);
  const lista = verArchivados ? todos.filter((c) => c.archivado_at) : activos;

  const cobrado = activos.concat(todos.filter((c) => c.archivado_at)).filter((c) => c.pago === "paid").reduce((a, c) => a + (c.comision ?? 0), 0);
  const pendiente = todos.filter((c) => c.fase === 4 && c.pago !== "paid").reduce((a, c) => a + (c.comision ?? 0), 0);
  const tramitacion = todos.filter((c) => c.fase < 4).length;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-navy p-6 text-white sm:p-8">
        <p className="text-white/70">Hola,</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{profile.nombre ?? profile.email}</h1>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Clientes", String(todos.length)], ["Cobrado", eur(cobrado)], ["Pendiente de cobro", eur(pendiente)], ["En tramitación", String(tramitacion)]].map(([t, v]) => (
            <div key={t} className="rounded-xl bg-white/10 p-4">
              <dt className="text-xs text-white/70">{t}</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{verArchivados ? "Clientes archivados" : "Clientes"}</h2>
          <Link href={verArchivados ? "/" : "/?archivados=1"} className="text-sm font-medium text-verde underline underline-offset-2">
            {verArchivados ? "Volver a clientes" : "Ver archivados"}
          </Link>
        </div>
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-navy/10">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-navy/10 bg-navy-50 text-navy/70">
              <tr>{["Cliente", "Fase", "MWh", "Tu %", "Tu comisión", "Cobro"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {lista.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-navy/60">{verArchivados ? "No hay clientes archivados." : "Aún no tienes clientes. INER los dará de alta por ti."}</td></tr>}
              {lista.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.nombre}</td>
                  <td className="px-4 py-3"><Fase fase={c.fase} /></td>
                  <td className="px-4 py-3 tabular-nums">{num(c.mwh)}</td>
                  <td className="px-4 py-3 tabular-nums">{num(c.pct)} %</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{eur(c.comision)}</td>
                  <td className="px-4 py-3">
                    {c.pago === "paid" ? <span className="font-semibold text-verde">Pagado · {fecha(c.pagado_at)}</span>
                      : c.pago === "requested" ? <span className="font-semibold text-[#8a5a00]">Pago solicitado</span>
                      : c.fase === 4 ? <form action={solicitarPago}><input type="hidden" name="id" value={c.id} /><Submit className="btn-verde !py-1.5" pendiente="Solicitando…">Solicitar pago</Submit></form>
                      : <span className="text-navy/50">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
