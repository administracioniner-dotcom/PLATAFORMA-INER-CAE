import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Embudo, Kpi, KpiFila } from "@/components/Fase";
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
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="tarjeta p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Avatar nombre={nombre} tamano="lg" />
            <div className="min-w-0">
              <p className="eyebrow !mb-0">Panel del colaborador</p>
              <h1 className="truncate text-3xl font-bold tracking-[-0.02em] sm:text-4xl">Hola, <span className="resalte">{primerNombre(nombre)}</span></h1>
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
        <Kpi tono="marca" etiqueta="Ya cobrado" valor={eur0(cobrado)} accion={listos > 0 ? { href: "#clientes", texto: "Ver clientes listos" } : undefined}
          nota={listos > 0 ? `${listos} cliente${listos > 1 ? "s" : ""} con el CAE expedido: ya puedes solicitar el pago` : "Lo que INER te ha pagado hasta hoy"} />
      </section>

      <KpiFila items={[
        { etiqueta: "Clientes que nos has pasado", valor: String(clientes.length) },
        { tono: "net", etiqueta: "En tramitación", valor: eur0(tramitacion), nota: "Aún sin CAE expedido" },
      ]} />

      <section className="tarjeta p-5 sm:p-6">
        <p className="eyebrow">Tus cobros</p>
        <h2 className="mb-1 text-2xl font-bold">Lo que has cobrado, mes a mes</h2>
        <p className="mb-4 text-sm text-muted">Últimos seis meses, según la fecha en que INER marcó cada pago.</p>
        {pagados.length === 0
          ? <Vacio icono="bateria" tono="batt" titulo="Aún no hay cobros" texto="Cuando INER marque como pagado el primer cliente, verás aquí tu evolución." />
          : <Barras titulo="Comisión cobrada por mes" meses={meses.map((m) => m.etiqueta)} series={[{ nombre: "Cobrado", color: "#0EA394", valores: porMes }]} formato={eur0} />}
      </section>

      <section id="clientes" className="tarjeta scroll-mt-24 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Tu cartera</p>
            <h2 className="text-2xl font-bold">{verArchivados ? "Clientes archivados" : "Tus clientes"}</h2>
          </div>
          {(nArchivados > 0 || verArchivados) && (
            <Link href={verArchivados ? "/" : "/?archivados=1"} className="btn btn-ghost !py-1.5">{verArchivados ? "Volver a tus clientes" : `Ver archivados (${nArchivados})`}</Link>
          )}
        </div>
        {lista.length === 0 && !verArchivados
          ? <Vacio icono="sol" titulo="Aún no tienes clientes" texto="INER los dará de alta por ti. En cuanto aparezca el primero, podrás seguir su fase y tu comisión desde aquí." />
          : <TablaClientes clientes={lista} vacio="No hay clientes archivados." />}
      </section>

      <section className="tarjeta flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-bold">¿Dudas con algún cliente o con un pago?</p>
          <p className="text-sm text-muted">Escribe a tu delegado comercial de INER y te responde por aquí.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/soporte" className="btn btn-ghost">Preguntas frecuentes</Link>
          <Link href="/mensajes" className="btn btn-primary flecha">Escribir a INER</Link>
        </div>
      </section>
    </div>
  );
}
