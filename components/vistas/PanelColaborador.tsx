import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Embudo, Kpi } from "@/components/Fase";
import { Barras } from "@/components/Graficos";
import { Vacio } from "@/components/Ilustraciones";
import { TablaClientes } from "@/components/vistas/TablaClientes";
import { claveMes, eur0, primerNombre, ultimosMeses } from "@/lib/utils";
import type { ClienteColab } from "@/lib/types";

export function PanelColaborador({ nombre, clientes, verArchivados }: { nombre: string; clientes: ClienteColab[]; verArchivados: boolean }) {
  const activos = clientes.filter((c) => !c.archivado_at);
  const nArchivados = clientes.length - activos.length;
  const lista = verArchivados ? clientes.filter((c) => c.archivado_at) : activos;
  const suma = (cs: ClienteColab[]) => cs.reduce((a, c) => a + (c.comision ?? 0), 0);
  const pagados = clientes.filter((c) => c.pago === "paid");
  const cobrado = suma(pagados);
  const tramitacion = suma(clientes.filter((c) => c.fase < 4));
  const listos = clientes.filter((c) => c.fase === 4 && c.pago === "none").length;
  const conteos = [0, 1, 2, 3, 4].map((f) => activos.filter((c) => c.fase === f).length);
  const meses = ultimosMeses(6);
  const porMes = meses.map((m) => suma(pagados.filter((c) => claveMes(c.pagado_at) === m.clave)));

  return (
    // En escritorio todo cabe en una pantalla: fila superior compacta y, debajo, gráfica y clientes (la tabla se desplaza dentro de su tarjeta).
    <div className="space-y-4 lg:grid lg:h-[calc(100dvh-5.75rem)] lg:min-h-[30rem] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-4 lg:space-y-0">
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
        <div className="tarjeta flex flex-col justify-center p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Avatar nombre={nombre} />
            <div className="min-w-0">
              <p className="eyebrow !mb-0">Panel del colaborador</p>
              <h1 className="truncate text-2xl font-bold tracking-[-0.02em]">Hola, <span className="resalte">{primerNombre(nombre)}</span></h1>
            </div>
          </div>
          <div className="mt-4">
            {activos.length === 0
              ? <p className="rounded-xl bg-soft px-3 py-2 text-sm text-muted">Aún no tienes clientes en tramitación. Cuando INER dé de alta el primero, lo verás avanzar fase a fase.</p>
              : <Embudo conteos={conteos} linea />}
          </div>
        </div>
        <Kpi tono="marca" compacto etiqueta="Ya cobrado" valor={eur0(cobrado)}
          nota={listos > 0 ? `${listos} cliente${listos > 1 ? "s" : ""} con el CAE expedido: ya puedes solicitar el pago` : "Lo que INER te ha pagado hasta hoy"} />
        <dl className="tarjeta grid grid-cols-2 divide-x divide-line lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
          <div className="flex flex-col justify-center px-5 py-3">
            <dt className="etiqueta">Clientes que nos has pasado</dt>
            <dd className="num text-2xl">{clientes.length}</dd>
          </div>
          <div className="flex flex-col justify-center px-5 py-3">
            <dt className="etiqueta">En tramitación</dt>
            <dd className="num text-2xl text-net-700">{eur0(tramitacion)}</dd>
            <p className="text-xs text-muted">Aún sin CAE expedido</p>
          </div>
        </dl>
      </section>

      <div className="grid gap-4 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
        <section className="tarjeta flex flex-col p-4 sm:p-5 lg:min-h-0">
          <h2 className="text-lg font-bold">Lo que has cobrado, mes a mes</h2>
          <p className="mb-3 text-xs text-muted">Últimos seis meses, según la fecha en que INER marcó cada pago.</p>
          {pagados.length === 0
            ? <Vacio icono="bateria" tono="batt" titulo="Aún no hay cobros" texto="Cuando INER marque como pagado el primer cliente, verás aquí tu evolución." />
            : <Barras llenar lg={{ W: 520, H: 300 }} titulo="Comisión cobrada por mes" meses={meses.map((m) => m.etiqueta)} series={[{ nombre: "Cobrado", color: "#0EA394", valores: porMes }]} formato={eur0} />}
        </section>

        <section id="clientes" className="tarjeta flex flex-col p-4 sm:p-5 lg:min-h-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{verArchivados ? "Clientes archivados" : "Tus clientes"}</h2>
            {(nArchivados > 0 || verArchivados) && (
              <Link href={verArchivados ? "/" : "/?archivados=1"} className="btn btn-ghost !px-4 !py-1.5">{verArchivados ? "Volver a tus clientes" : `Ver archivados (${nArchivados})`}</Link>
            )}
          </div>
          {lista.length === 0 && !verArchivados
            ? <Vacio icono="sol" titulo="Aún no tienes clientes" texto="INER los dará de alta por ti. En cuanto aparezca el primero, podrás seguir su fase y tu comisión desde aquí." />
            : <TablaClientes clientes={lista} vacio="No hay clientes archivados." />}
        </section>
      </div>
    </div>
  );
}
