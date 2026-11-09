import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CabeceraConversacion, ChipsHilos, Conversacion } from "@/components/mensajes/Conversacion";
import { ListaConversaciones, type ItemLista } from "@/components/mensajes/ListaConversaciones";
import type { Sugerencia } from "@/components/mensajes/Compositor";
import { colorDe, conversaciones } from "@/lib/mensajes";
import { requireStaff } from "@/lib/auth";
import { FASES, comisionDe, cx, eur0, fecha, fechaLista, iniciales, FASE_FINAL } from "@/lib/utils";
import type { Mensaje, Profile } from "@/lib/types";

// Respuestas que se repiten. Rellenan la caja y se pueden editar antes de enviar.
const RESPUESTAS_RAPIDAS: Sugerencia[] = [
  { etiqueta: "Ya está marcado como pagado", relleno: "Ya está marcado como pagado." },
  { etiqueta: "Dado de alta", relleno: "Lo hemos dado de alta, ya lo ves en tu panel." },
  { etiqueta: "Lo revisamos", relleno: "Lo revisamos y te decimos algo." },
];

type Cliente = { id: string; nombre: string; fase: number; pago: "none" | "requested" | "paid"; mwh: number | null; pct: number; precio_mwh: number; archivado_at: string | null };

export default async function MensajesEquipo({ searchParams }: { searchParams: Promise<{ c?: string; hilo?: string }> }) {
  const { c, hilo } = await searchParams;
  const { supabase } = await requireStaff();
  const [{ data: ps }, { data: ms }] = await Promise.all([
    supabase.from("profiles").select("id,nombre,email,created_at").eq("rol", "colaborador").order("nombre"),
    supabase.from("mensajes").select("colaborador_id,leido,remitente,fecha,texto").order("fecha", { ascending: false }).limit(1500),
  ]);
  const colabs = (ps ?? []) as Pick<Profile, "id" | "nombre" | "email" | "created_at">[];

  // Una fila por colaborador: último mensaje de una persona (los avisos automáticos no cuentan) y mensajes sin leer.
  const resumen = new Map<string, { texto: string; fecha: string; mio: boolean; sinLeer: number }>();
  for (const m of ms ?? []) {
    let r = resumen.get(m.colaborador_id);
    if (!r) { r = { texto: "", fecha: "", mio: false, sinLeer: 0 }; resumen.set(m.colaborador_id, r); }
    if (m.remitente === "sistema") continue;
    if (!r.fecha) { r.texto = m.texto; r.fecha = m.fecha; r.mio = m.remitente === "delegado"; }
    if (!m.leido && m.remitente === "colaborador") r.sinLeer++;
  }
  const ordenados = [...colabs].sort((a, b) => {
    const ra = resumen.get(a.id), rb = resumen.get(b.id);
    if ((rb?.sinLeer ?? 0) !== (ra?.sinLeer ?? 0)) return (rb?.sinLeer ?? 0) - (ra?.sinLeer ?? 0);
    if (ra?.fecha && rb?.fecha) return rb.fecha.localeCompare(ra.fecha);
    if (ra?.fecha) return -1;
    if (rb?.fecha) return 1;
    return (a.nombre ?? a.email).localeCompare(b.nombre ?? b.email, "es");
  });
  const hayPendientes = ordenados.some((p) => (resumen.get(p.id)?.sinLeer ?? 0) > 0);
  const elegido = ordenados.find((p) => p.id === c);
  // En escritorio se ve siempre un colaborador (el primero de la lista); en móvil, la lista hasta que se toca uno.
  const actual = elegido ?? ordenados[0];
  const vista = elegido ? "chat" : "lista";

  const items: ItemLista[] = ordenados.map((p) => {
    const r = resumen.get(p.id);
    const nombre = p.nombre ?? p.email;
    return {
      clave: p.id, href: `/equipo/mensajes?c=${p.id}`, titulo: nombre,
      subtitulo: r?.fecha ? `${r.mio ? "Tú: " : ""}${r.texto}` : "Sin mensajes todavía",
      hora: r?.fecha ? fechaLista(r.fecha) : "", noLeidos: r?.sinLeer ?? 0, color: colorDe(p.id), iniciales: iniciales(nombre), activo: p.id === actual?.id,
    };
  });

  let chat: React.ReactNode = <div className="grid h-full place-items-center bg-soft p-8 text-muted">Aún no hay colaboradores.</div>;
  let ficha: React.ReactNode = null;
  if (actual) {
    const [{ data: mm }, { data: cs }] = await Promise.all([
      supabase.from("mensajes").select("*").eq("colaborador_id", actual.id).order("fecha", { ascending: false }).limit(500),
      supabase.from("clientes").select("id,nombre,fase,pago,mwh,pct,precio_mwh,archivado_at").eq("colaborador_id", actual.id).order("created_at", { ascending: false }),
    ]);
    const mensajes = (mm ?? []) as Mensaje[];
    const clientes = (cs ?? []) as Cliente[];
    const convs = conversaciones(mensajes, clientes, (m) => m.remitente === "colaborador", (m) => m.remitente === "delegado");
    const sel = (hilo ? convs.find((x) => x.clave === hilo) : undefined) ?? convs.find((x) => x.noLeidos > 0) ?? convs.find((x) => x.clave === "general")!;
    const cliente = clientes.find((x) => x.id === sel.clienteId);
    const hiloActual = mensajes.filter((m) => (m.cliente_id ?? null) === sel.clienteId).reverse();
    const nombre = actual.nombre ?? actual.email;
    const base = `/equipo/mensajes?c=${actual.id}`;
    // Solo las conversaciones con mensajes, la general y la que se está viendo; el resto de clientes se ven en la ficha.
    const chips = convs.filter((x) => x.clave === "general" || x.ultimoFecha || x.clave === sel.clave)
      .map((x) => ({ clave: x.clave, href: `${base}&hilo=${x.clave}`, etiqueta: x.titulo === "Conversación general" ? "General" : x.titulo, noLeidos: x.noLeidos, activo: x.clave === sel.clave }));

    chat = (
      <Conversacion
        clienteId={sel.clienteId} colaboradorId={actual.id} yo="delegado" mensajes={hiloActual}
        otro={{ nombre, iniciales: iniciales(nombre), color: colorDe(actual.id) }}
        sugerencias={RESPUESTAS_RAPIDAS} rotulo="Respuestas rápidas" placeholder={`Responder a ${nombre}`}
        vacio="Todavía no hay mensajes aquí. Escribe el primero."
        cabecera={
          <CabeceraConversacion
            volverHref="/equipo/mensajes" iniciales={iniciales(nombre)} color={colorDe(actual.id)} titulo={nombre}
            subtitulo={cliente ? `Conversación sobre ${cliente.nombre}` : "Conversación general"}
            estado={cliente ? (cliente.pago === "paid" ? "Pagado" : cliente.pago === "requested" ? "Pago solicitado" : FASES[cliente.fase]) : undefined}
            tono={cliente && (cliente.fase === FASE_FINAL || cliente.pago === "paid") ? "batt" : "net"}
            verHref={cliente ? `/equipo/colaboradores/${actual.id}` : undefined}
          />
        }
        extra={<ChipsHilos items={chips} />}
      />
    );

    const solicitados = clientes.filter((x) => x.pago === "requested");
    const importe = solicitados.reduce((a, x) => a + comisionDe(x), 0);
    const sinLeer = resumen.get(actual.id)?.sinLeer ?? 0;
    const vivos = clientes.filter((x) => !x.archivado_at);
    ficha = (
      <aside aria-label={`Ficha de ${nombre}`} className="hidden min-h-0 space-y-4 overflow-y-auto border-l border-line bg-panel p-4 xl:block">
        <div>
          <p className="text-base font-bold">{nombre}</p>
          <p className="break-all text-xs text-muted">{actual.email}</p>
          <p className="text-xs text-muted">Colaborador desde {fecha(actual.created_at)}</p>
        </div>
        <section>
          <h3 className="etiqueta mb-1">Por revisar</h3>
          <dl className="divide-y divide-line text-sm">
            <div className="flex justify-between gap-2 py-1.5"><dt>Pago solicitado</dt><dd className="font-bold">{solicitados.length === 0 ? "Ninguno" : `${solicitados.length} · ${eur0(importe)}`}</dd></div>
            <div className="flex justify-between gap-2 py-1.5"><dt>Mensajes sin leer</dt><dd className="font-bold">{sinLeer}</dd></div>
          </dl>
        </section>
        <section>
          <h3 className="etiqueta mb-1">Sus clientes</h3>
          {vivos.length === 0 ? <p className="text-sm text-muted">Todavía no tiene clientes.</p> : (
            <ul className="divide-y divide-line text-sm">
              {vivos.slice(0, 8).map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="truncate">{x.nombre}</span>
                  <span className={cx("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", x.fase === FASE_FINAL ? "bg-batt-50 text-batt-700" : "bg-net-50 text-net-700")}>{x.pago === "paid" ? "Pagado" : x.pago === "requested" ? "Pago solicitado" : FASES[x.fase]}</span>
                </li>
              ))}
            </ul>
          )}
          {vivos.length > 8 && <p className="mt-1 text-xs text-muted">y {vivos.length - 8} más</p>}
          <Link href={`/equipo/colaboradores/${actual.id}`} className="btn btn-ghost mt-3 !px-4 !py-1.5 !text-xs">Abrir ficha completa →</Link>
        </section>
      </aside>
    );
  }

  return (
    <>
      <AutoRefresh cada={30} />
      <h1 className="mb-3 text-3xl font-bold tracking-[-0.02em]">Mensajes</h1>
      <div className="tarjeta grid h-[calc(100dvh-13rem)] min-h-[28rem] overflow-hidden md:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_16.5rem]">
        <div className={cx("min-h-0 flex-col border-line md:flex md:border-r", vista === "chat" ? "hidden" : "flex")}>
          {colabs.length === 0
            ? <p className="p-4 text-sm text-muted">Aún no hay colaboradores.</p>
            : <ListaConversaciones items={items} buscar="Buscar colaborador" etiquetaPendientes="Con pendientes" filtroInicial={hayPendientes ? "sin" : "todas"} />}
        </div>
        <div className={cx("min-h-0 md:block", vista === "lista" ? "hidden" : "block")}>{chat}</div>
        {ficha}
      </div>
    </>
  );
}
