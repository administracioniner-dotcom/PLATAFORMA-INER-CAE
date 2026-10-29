import Link from "next/link";
import { solicitarPago } from "@/app/actions";
import { Submit } from "@/components/Submit";
import { Puntos } from "@/components/Fase";
import { requireColaborador } from "@/lib/auth";
import { FASES, eur, fecha, num } from "@/lib/utils";
import type { ClienteColab } from "@/lib/types";

const iniciales = (n: string) => n.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default async function Panel({ searchParams }: { searchParams: Promise<{ archivados?: string }> }) {
  const { archivados } = await searchParams;
  const verArchivados = archivados === "1";
  const { supabase, profile } = await requireColaborador();
  const { data } = await supabase.from("mis_clientes").select("*").order("created_at", { ascending: false });
  const todos = (data ?? []) as ClienteColab[];
  const nArchivados = todos.filter((c) => c.archivado_at).length;
  const lista = todos.filter((c) => (verArchivados ? c.archivado_at : !c.archivado_at));

  const suma = (cs: ClienteColab[]) => cs.reduce((a, c) => a + (c.comision ?? 0), 0);
  const cobrado = suma(todos.filter((c) => c.pago === "paid"));
  const pendiente = suma(todos.filter((c) => c.fase === 4 && c.pago !== "paid"));
  const tramitacion = suma(todos.filter((c) => c.fase < 4));
  const nombre = profile.nombre ?? profile.email;

  const kpis = [
    { t: "Clientes que nos has pasado", v: String(todos.length), n: null, resalta: false, color: "text-navy" },
    { t: "Ya cobrado", v: eur(cobrado), n: null, resalta: false, color: "text-verde" },
    { t: "Pendiente de cobro", v: eur(pendiente), n: "CAE ya expedido", resalta: pendiente > 0, color: "text-[#6b4700]" },
    { t: "En tramitación", v: eur(tramitacion), n: "Aún sin CAE expedido", resalta: false, color: "text-navy" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-navy p-5 text-white sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <span aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-2 border-ambar bg-navy-700 text-2xl font-bold text-ambar">{iniciales(nombre)}</span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold sm:text-2xl">{nombre}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full bg-ambar px-2.5 py-0.5 font-bold text-navy">Colaborador INER</span>
              <span className="truncate">{profile.email}</span>
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-white/10 px-4 py-3">
          <p className="text-xs text-white/70">Tu comisión</p>
          <p className="text-xl font-bold text-ambar">Un % por cliente</p>
          <p className="text-xs text-white/70">Lo ves en cada uno de tus clientes</p>
        </div>
      </section>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.t} className={`rounded-xl p-4 ring-1 ${k.resalta ? "bg-ambar-50 ring-ambar/50" : "bg-white ring-navy/10"}`}>
            <dt className="text-xs text-navy/70">{k.t}</dt>
            <dd className={`mt-1 text-2xl font-bold tabular-nums ${k.color}`}>{k.v}</dd>
            {k.n && <p className="mt-0.5 text-[11px] text-navy/60">{k.n}</p>}
          </div>
        ))}
      </dl>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-navy/10">
        <h2 className="mb-3 text-base font-bold">{verArchivados ? "Clientes archivados" : "Tus clientes"}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="text-xs text-navy/60">
              <tr>
                <th className="py-2 font-semibold">Cliente</th>
                <th className="py-2 font-semibold">En qué fase está</th>
                <th className="py-2 text-right font-semibold">MWh</th>
                <th className="py-2 text-right font-semibold">Tu %</th>
                <th className="py-2 text-right font-semibold">Tu comisión</th>
                <th className="py-2 pl-6 font-semibold">Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 border-t border-navy/10">
              {lista.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-navy/60">{verArchivados ? "No hay clientes archivados." : "Aún no tienes clientes. INER los dará de alta por ti."}</td></tr>}
              {lista.map((c) => (
                <tr key={c.id}>
                  <td className="py-3.5 pr-3 font-semibold">{c.nombre}</td>
                  <td className="py-3.5 pr-3"><Puntos fase={c.fase} /></td>
                  <td className="py-3.5 text-right tabular-nums">{num(c.mwh)}</td>
                  <td className="py-3.5 text-right tabular-nums">{num(c.pct)} %</td>
                  <td className="py-3.5 text-right font-bold tabular-nums">{eur(c.comision)}</td>
                  <td className="py-3.5 pl-6">
                    {c.pago === "paid" ? <span className="inline-block rounded-full bg-verde-50 px-3 py-1 text-xs font-semibold text-[#0b7a4d]">Pagado · {fecha(c.pagado_at)}</span>
                      : c.pago === "requested" ? <span className="inline-block rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold">Pago solicitado</span>
                      : c.fase === 4 ? <form action={solicitarPago}><input type="hidden" name="id" value={c.id} /><Submit className="!bg-ambar !text-navy hover:!bg-[#e0961a]" pendiente="Solicitando…">Solicitar pago</Submit></form>
                      : <span className="block max-w-[11rem] text-xs text-navy/60">Podrás solicitarlo al expedirse el CAE</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-navy/10 pt-3 text-[11px] text-navy/70">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-verde" />Fase superada</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ambar" />Fase actual</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-navy/15" />Pendiente</span>
          <span>Fases: {FASES.join(" · ")}</span>
        </p>
        {(nArchivados > 0 || verArchivados) && (
          <Link href={verArchivados ? "/" : "/?archivados=1"} className="mt-3 inline-block text-xs font-semibold underline underline-offset-2">
            {verArchivados ? "Volver a clientes" : `Ver archivados (${nArchivados})`}
          </Link>
        )}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-navy/10">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-navy-100 text-xs font-bold">DE</span>
          <div>
            <p className="font-bold">¿Dudas con algún cliente o con un pago?</p>
            <p className="text-xs text-navy/60">Escribe a tu delegado comercial de INER.</p>
          </div>
        </div>
        <Link href="/mensajes" className="btn !bg-ambar !text-navy hover:!bg-[#e0961a]">Contactar</Link>
      </section>
    </div>
  );
}
