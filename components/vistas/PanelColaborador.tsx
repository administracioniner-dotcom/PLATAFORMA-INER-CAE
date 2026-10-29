import Link from "next/link";
import { solicitarPago } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { Embudo, Kpi, Recorrido } from "@/components/Fase";
import { Submit } from "@/components/Submit";
import { eur, eur0, fecha, num, primerNombre } from "@/lib/utils";
import type { ClienteColab } from "@/lib/types";

function Cobro({ c }: { c: ClienteColab }) {
  if (c.pago === "paid") return <span className="inline-block rounded-full bg-batt-50 px-3 py-1 text-xs font-bold text-batt-700">Pagado · {fecha(c.pagado_at)}</span>;
  if (c.pago === "requested") return <span className="inline-block rounded-full bg-net-50 px-3 py-1 text-xs font-bold text-net-700">Pago solicitado</span>;
  if (c.fase === 4) return <form action={solicitarPago}><input type="hidden" name="id" value={c.id} /><Submit className="btn-primary !py-1.5" pendiente="Solicitando…">Solicitar pago</Submit></form>;
  return <span className="text-xs text-muted">Podrás solicitarlo cuando se expida el CAE</span>;
}

export function PanelColaborador({ nombre, clientes, verArchivados }: { nombre: string; clientes: ClienteColab[]; verArchivados: boolean }) {
  const activos = clientes.filter((c) => !c.archivado_at);
  const nArchivados = clientes.length - activos.length;
  const lista = verArchivados ? clientes.filter((c) => c.archivado_at) : activos;
  const suma = (cs: ClienteColab[]) => cs.reduce((a, c) => a + (c.comision ?? 0), 0);
  const cobrado = suma(clientes.filter((c) => c.pago === "paid"));
  const pendiente = suma(clientes.filter((c) => c.fase === 4 && c.pago !== "paid"));
  const tramitacion = suma(clientes.filter((c) => c.fase < 4));
  const listos = clientes.filter((c) => c.fase === 4 && c.pago === "none").length;
  const conteos = [0, 1, 2, 3, 4].map((f) => activos.filter((c) => c.fase === f).length);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="tarjeta p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Avatar nombre={nombre} tamano="lg" />
            <div className="min-w-0">
              <h1 className="truncate text-3xl font-bold tracking-[-0.02em] sm:text-4xl">Hola, {primerNombre(nombre)}</h1>
              <p className="text-muted">Así van los clientes que nos has pasado.</p>
            </div>
          </div>
          <div className="mt-7">
            <h2 className="mb-3 font-bold">Recorrido de tus clientes</h2>
            {activos.length === 0
              ? <p className="rounded-xl bg-soft p-4 text-sm text-muted">Aún no tienes clientes en tramitación. Cuando INER dé de alta el primero, lo verás aquí avanzar fase a fase.</p>
              : <Embudo conteos={conteos} />}
          </div>
        </div>
        <Kpi tono="marca" etiqueta="Pendiente de cobro" valor={eur0(pendiente)} accion={listos > 0 ? { href: "#clientes", texto: "Ver clientes listos" } : undefined}
          nota={listos > 0 ? `${listos} cliente${listos > 1 ? "s" : ""} con el CAE expedido: ya puedes solicitar el pago` : "Cuando se expida un CAE podrás solicitar el pago"} />
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Kpi etiqueta="Clientes que nos has pasado" valor={String(clientes.length)} />
        <Kpi tono="batt" etiqueta="Ya cobrado" valor={eur0(cobrado)} />
        <Kpi tono="net" etiqueta="En tramitación" valor={eur0(tramitacion)} nota="Aún sin CAE expedido" />
      </section>

      <section id="clientes" className="tarjeta scroll-mt-24 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{verArchivados ? "Clientes archivados" : "Tus clientes"}</h2>
          {(nArchivados > 0 || verArchivados) && (
            <Link href={verArchivados ? "/" : "/?archivados=1"} className="btn btn-ghost !py-1.5">{verArchivados ? "Volver a tus clientes" : `Ver archivados (${nArchivados})`}</Link>
          )}
        </div>
        {lista.length === 0 ? (
          <p className="rounded-xl bg-soft p-8 text-center text-muted">{verArchivados ? "No hay clientes archivados." : "Aún no tienes clientes. INER los dará de alta por ti."}</p>
        ) : (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="pb-3 font-semibold">Cliente</th><th className="pb-3 font-semibold">En qué fase está</th>
                  <th className="pb-3 text-right font-semibold">MWh</th><th className="pb-3 text-right font-semibold">Tu %</th>
                  <th className="pb-3 text-right font-semibold">Tu comisión</th><th className="pb-3 pl-8 font-semibold">Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-t border-line">
                {lista.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-soft/60">
                    <td className="py-4 pr-4"><span className="font-bold">{c.nombre}</span><span className="block text-xs text-muted">Alta {fecha(c.created_at)}</span></td>
                    <td className="py-4 pr-4"><Recorrido fase={c.fase} /></td>
                    <td className="py-4 text-right font-mono tabular-nums">{num(c.mwh)}</td>
                    <td className="py-4 text-right font-mono tabular-nums">{num(c.pct)} %</td>
                    <td className="py-4 text-right font-mono font-bold tabular-nums">{eur(c.comision)}</td>
                    <td className="py-4 pl-8"><Cobro c={c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="space-y-3 md:hidden">
              {lista.map((c) => (
                <li key={c.id} className="rounded-xl bg-soft p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-bold">{c.nombre}</p><p className="text-xs text-muted">Alta {fecha(c.created_at)}</p></div>
                    <p className="num text-lg">{eur(c.comision)}</p>
                  </div>
                  <div className="mt-3"><Recorrido fase={c.fase} /></div>
                  <p className="mt-2 font-mono text-xs text-muted">{num(c.mwh)} MWh · tu {num(c.pct)} %</p>
                  <div className="mt-3"><Cobro c={c} /></div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="tarjeta flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-bold">¿Dudas con algún cliente o con un pago?</p>
          <p className="text-sm text-muted">Escribe a tu delegado comercial de INER y te responde por aquí.</p>
        </div>
        <Link href="/mensajes" className="btn btn-primary">Escribir a INER</Link>
      </section>
    </div>
  );
}
