import Link from "next/link";
import { notFound } from "next/navigation";
import { guardarMwh, guardarPct, marcarPagado, moverFase, sacarDelArchivo } from "@/app/actions";
import { requireStaff } from "@/lib/auth";
import { FASES, VALOR_MWH, eur, fecha } from "@/lib/utils";
import type { ClienteStaff, Profile } from "@/lib/types";

export default async function ColaboradorDetalle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ archivados?: string }> }) {
  const { id } = await params;
  const verArchivados = (await searchParams).archivados === "1";
  const { supabase } = await requireStaff();
  const { data: p } = await supabase.from("profiles").select("*").eq("id", id).eq("rol", "colaborador").single();
  if (!p) notFound();
  const col = p as Profile;
  const { data } = await supabase.from("clientes").select("*").eq("colaborador_id", id).order("created_at");
  const todos = (data ?? []) as ClienteStaff[];
  const lista = todos.filter((c) => (verArchivados ? !!c.archivado_at : !c.archivado_at));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/equipo" className="text-sm font-medium text-verde underline underline-offset-2">← Colaboradores</Link>
          <h1 className="mt-1 text-2xl font-bold">{col.nombre ?? col.email}</h1>
          <p className="text-sm text-navy/60">{col.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/equipo/mensajes?c=${id}`} className="btn btn-ghost">Mensajes</Link>
          <Link href={`/equipo/colaboradores/${id}${verArchivados ? "" : "?archivados=1"}`} className="btn btn-ghost">{verArchivados ? "Ver activos" : "Ver archivados"}</Link>
        </div>
      </div>

      {verArchivados ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.length === 0 && <li className="col-span-full rounded-xl bg-white p-8 text-center text-navy/60 ring-1 ring-navy/10">No hay clientes archivados.</li>}
          {lista.map((c) => (
            <li key={c.id} className="rounded-xl bg-white p-4 ring-1 ring-navy/10">
              <p className="font-bold">{c.nombre}</p>
              <p className="text-sm text-navy/70">Pagado el {fecha(c.pagado_at)} · archivado el {fecha(c.archivado_at)}</p>
              <form action={sacarDelArchivo} className="mt-3"><input type="hidden" name="id" value={c.id} /><button className="btn btn-ghost !py-1.5">Sacar del archivo</button></form>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-3 lg:grid-cols-5">
          {FASES.map((nombreFase, fase) => {
            const enFase = lista.filter((c) => c.fase === fase);
            return (
              <section key={nombreFase} aria-label={nombreFase} className="rounded-2xl bg-navy-100/60 p-2.5">
                <h2 className="mb-2 flex items-center justify-between px-1.5 text-sm font-bold">{nombreFase}<span className="rounded-full bg-white px-2 text-xs">{enFase.length}</span></h2>
                <ul className="space-y-2.5">
                  {enFase.map((c) => (
                    <li key={c.id} className="rounded-xl bg-white p-3 text-sm ring-1 ring-navy/10">
                      <p className="font-bold">{c.nombre}</p>
                      <form action={guardarMwh} className="mt-2 flex items-end gap-1.5">
                        <input type="hidden" name="id" value={c.id} />
                        <div className="flex-1"><label className="text-xs text-navy/60" htmlFor={`mwh-${c.id}`}>MWh</label><input id={`mwh-${c.id}`} name="mwh" inputMode="decimal" defaultValue={c.mwh ?? ""} className="input !py-1" /></div>
                        <button className="btn btn-ghost !px-2 !py-1">Guardar</button>
                      </form>
                      <form action={guardarPct} className="mt-1.5 flex items-end gap-1.5">
                        <input type="hidden" name="id" value={c.id} />
                        <div className="flex-1"><label className="text-xs text-navy/60" htmlFor={`pct-${c.id}`}>% del colaborador</label><input id={`pct-${c.id}`} name="pct" inputMode="decimal" defaultValue={c.pct} className="input !py-1" /></div>
                        <button className="btn btn-ghost !px-2 !py-1">Guardar</button>
                      </form>
                      <p className="mt-2 text-xs text-navy/70">
                        Valor {eur((c.mwh ?? 0) * VALOR_MWH)} · comisión <span className="font-semibold text-navy">{eur((c.mwh ?? 0) * VALOR_MWH * c.pct / 100)}</span>
                      </p>
                      {c.pago === "requested" && <p className="mt-1.5 rounded-lg bg-ambar-50 px-2 py-1 text-xs font-semibold text-[#6b4700]">Pago solicitado el {fecha(c.solicitado_at)}</p>}
                      {c.pago === "paid" && <p className="mt-1.5 rounded-lg bg-verde-50 px-2 py-1 text-xs font-semibold text-[#0b7a4d]">Pagado el {fecha(c.pagado_at)}</p>}
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <form action={moverFase}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="-1" /><button disabled={fase === 0} aria-label="Volver a la fase anterior" className="btn btn-ghost !px-2.5 !py-1">←</button></form>
                        <form action={moverFase}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="1" /><button disabled={fase === 4} aria-label="Pasar a la fase siguiente" className="btn btn-ghost !px-2.5 !py-1">→</button></form>
                        {fase === 4 && c.pago !== "paid" && (
                          <form action={marcarPagado} className="ml-auto"><input type="hidden" name="id" value={c.id} /><button className="btn btn-verde !py-1">Marcar como pagado</button></form>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
