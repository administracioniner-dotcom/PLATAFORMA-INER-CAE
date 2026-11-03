import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { solicitarPago } from "@/app/actions";
import { Contador } from "@/components/Contador";
import { Embudo } from "@/components/Fase";
import { FormAviso } from "@/components/FormAviso";
import { Submit } from "@/components/Submit";
import { Barras } from "@/components/Graficos";
import { Vacio } from "@/components/Ilustraciones";
import { TablaClientes } from "@/components/vistas/TablaClientes";
import { claveMes, eur0, primerNombre, ultimosMeses } from "@/lib/utils";
import type { ClienteColab } from "@/lib/types";

export function PanelColaborador({ nombre, clientes, verArchivados, sinLeer = 0 }: { nombre: string; clientes: ClienteColab[]; verArchivados: boolean; sinLeer?: number }) {
  const activos = clientes.filter((c) => !c.archivado_at);
  const nArchivados = clientes.length - activos.length;
  const lista = verArchivados ? clientes.filter((c) => c.archivado_at) : activos;
  const suma = (cs: ClienteColab[]) => cs.reduce((a, c) => a + (c.comision ?? 0), 0);
  const pagados = clientes.filter((c) => c.pago === "paid");
  const cobrado = suma(pagados);
  const tramitacion = suma(clientes.filter((c) => c.fase < 4));
  const listosLista = activos.filter((c) => c.fase === 4 && c.pago === "none");
  const solicitados = clientes.filter((c) => c.pago === "requested").length;
  const pendiente = suma(clientes.filter((c) => c.pago !== "paid"));
  const potencial = cobrado + pendiente;
  const conteos = [0, 1, 2, 3, 4].map((f) => activos.filter((c) => c.fase === f).length);
  const meses = ultimosMeses(6);
  const porMes = meses.map((m) => suma(pagados.filter((c) => claveMes(c.pagado_at) === m.clave)));
  const esteMes = porMes[porMes.length - 1] ?? 0;
  const mesPasado = porMes[porMes.length - 2] ?? 0;
  const primero = listosLista[0];
  const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

  return (
    // En escritorio todo cabe en una pantalla: fila superior compacta y, debajo, gráfica y clientes (la tabla se desplaza dentro de su tarjeta).
    <div className="space-y-4 lg:grid lg:h-[calc(100dvh-5.75rem)] lg:min-h-[30rem] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-4 lg:space-y-0">
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
        <div className="entra relative flex flex-col justify-center gap-3 overflow-hidden rounded-[18px] bg-ink p-4 text-white shadow-card sm:p-5" style={{ ["--i" as string]: 0 }}>
          <span aria-hidden className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(234,84,9,.5), transparent)" }} />
          <div className="relative flex items-center gap-3">
            <Avatar nombre={nombre} claro />
            <div className="min-w-0">
              <p className="eyebrow !mb-0 !text-[#FFB48A]">Panel del colaborador</p>
              <h1 className="truncate text-2xl font-bold tracking-[-0.02em]">Hola, <span className="resalte resalte-solido">{primerNombre(nombre)}</span></h1>
            </div>
          </div>
          <div className="relative rounded-2xl border border-white/15 bg-white/[.08] p-3.5">
            {primero ? (
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[.04em] text-white/75">Lo siguiente para ti</p>
                  <p className="truncate font-bold">{primero.nombre}: CAE expedido</p>
                  {listosLista.length > 1 && <p className="text-xs text-white/80">y {listosLista.length - 1} {plural(listosLista.length - 1, "cliente más", "clientes más")} listos para cobrar</p>}
                </div>
                <FormAviso action={solicitarPago}>
                  <input type="hidden" name="id" value={primero.id} />
                  <Submit className="latido !bg-white !text-ink hover:!bg-[#FFD9C2]" pendiente="Solicitando…">Solicitar pago{primero.comision != null ? ` · ${eur0(primero.comision)}` : ""}</Submit>
                </FormAviso>
              </div>
            ) : sinLeer > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.04em] text-white/75">Lo siguiente para ti</p>
                  <p className="font-bold">{sinLeer} {plural(sinLeer, "mensaje sin leer", "mensajes sin leer")} de INER</p>
                </div>
                <Link href="/mensajes" className="btn latido !bg-white !text-ink hover:!bg-[#FFD9C2]">Leer {plural(sinLeer, "mensaje", "mensajes")}</Link>
              </div>
            ) : solicitados > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.04em] text-white/75">En marcha</p>
                <p className="font-bold">INER está revisando {solicitados} {plural(solicitados, "solicitud de pago", "solicitudes de pago")}</p>
              </div>
            ) : activos.length === 0 ? (
              <p className="text-sm text-white/85">Aún no tienes clientes en tramitación. Cuando INER dé de alta el primero, lo verás avanzar fase a fase.</p>
            ) : (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.04em] text-white/75">Todo en marcha</p>
                <p className="font-bold">Tus {activos.length} {plural(activos.length, "cliente avanza", "clientes avanzan")} sin nada pendiente por tu parte</p>
              </div>
            )}
          </div>
          {activos.length > 0 && <div className="relative"><Embudo conteos={conteos} compacto /></div>}
        </div>
        <div className="entra tarjeta flex flex-col justify-center p-4 sm:p-5" style={{ ["--i" as string]: 1 }}>
          <p className="etiqueta">Ya cobrado</p>
          <p className="num mt-1 text-4xl text-ink"><Contador valor={cobrado} /></p>
          <p className="mt-1 text-xs text-muted">Este mes {eur0(esteMes)} · el mes pasado {eur0(mesPasado)}</p>
          {potencial > cobrado ? (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft" role="img" aria-label={`Has cobrado el ${Math.round((cobrado / potencial) * 100)} % de lo que puedes llegar a cobrar`}>
                <span className="tramo block h-full rounded-full bg-gradient-to-r from-batt to-marca" style={{ width: `${Math.max(Math.round((cobrado / potencial) * 100), cobrado > 0 ? 3 : 0)}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted">Con lo que tienes en trámite llegarías a <b className="text-ink">{eur0(potencial)}</b></p>
            </>
          ) : <p className="mt-3 text-xs text-muted">Lo que INER te ha pagado hasta hoy</p>}
        </div>
        <dl className="entra tarjeta grid grid-cols-2 divide-x divide-line lg:grid-cols-1 lg:divide-x-0 lg:divide-y" style={{ ["--i" as string]: 2 }}>
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
        <section className="entra tarjeta flex flex-col p-4 sm:p-5 lg:min-h-0" style={{ ["--i" as string]: 3 }}>
          <h2 className="text-lg font-bold">Lo que has cobrado, mes a mes</h2>
          <p className="mb-3 text-xs text-muted">Últimos seis meses, según la fecha en que INER marcó cada pago.</p>
          {pagados.length === 0
            ? <Vacio icono="bateria" tono="batt" titulo="Aún no hay cobros" texto="Cuando INER marque como pagado el primer cliente, verás aquí tu evolución." />
            : <Barras llenar lg={{ W: 520, H: 300 }} titulo="Comisión cobrada por mes" meses={meses.map((m) => m.etiqueta)} series={[{ nombre: "Cobrado", color: "#0EA394", valores: porMes }]} formato={eur0} />}
        </section>

        <section id="clientes" className="entra tarjeta flex flex-col p-4 sm:p-5 lg:min-h-0" style={{ ["--i" as string]: 4 }}>
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
