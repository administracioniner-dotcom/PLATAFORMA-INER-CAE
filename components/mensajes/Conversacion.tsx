import Link from "next/link";
import { Compositor, type Sugerencia } from "@/components/mensajes/Compositor";
import { FlujoMensajes } from "@/components/mensajes/FlujoMensajes";
import { Iniciales } from "@/components/mensajes/Iniciales";
import { MarcarLeidos } from "@/components/mensajes/MarcarLeidos";
import { evento } from "@/lib/mensajes";
import { cx, diaClave, etiquetaDia, hora } from "@/lib/utils";
import type { Mensaje } from "@/lib/types";

/** Cabecera de una conversación: con quién o de qué cliente se habla, su estado y un enlace para abrirlo. */
export function CabeceraConversacion({ volverHref, iniciales, color, titulo, subtitulo, estado, tono = "net", dato, verHref }: {
  volverHref: string; iniciales: string; color: string; titulo: string; subtitulo: string;
  estado?: string; tono?: "net" | "batt"; dato?: string; verHref?: string;
}) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-line bg-panel px-3 py-2.5 sm:px-4">
      <Link href={volverHref} aria-label="Volver a la lista" className="grid h-8 w-8 place-items-center rounded-full bg-soft text-lg md:hidden">←</Link>
      <Iniciales texto={iniciales} color={color} />
      <div className="min-w-0">
        <h2 className="truncate text-base font-bold leading-tight">{titulo}</h2>
        <p className="truncate text-xs text-muted">{subtitulo}</p>
      </div>
      {(estado || verHref) && (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {estado && <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-bold", tono === "batt" ? "bg-batt-50 text-batt-700" : "bg-net-50 text-net-700")}>{estado}</span>}
          {dato && <span className="text-xs text-muted">{dato}</span>}
          {verHref && <Link href={verHref} className="btn btn-ghost !px-3.5 !py-1 !text-xs">Ver cliente →</Link>}
        </div>
      )}
    </header>
  );
}

/** Fila de conversaciones de una misma persona (la general y la de cada cliente), para cambiar de una a otra. */
export function ChipsHilos({ items }: { items: { clave: string; href: string; etiqueta: string; noLeidos: number; activo: boolean }[] }) {
  return (
    <nav aria-label="Conversaciones de este colaborador" className="flex gap-1.5 overflow-x-auto border-b border-line bg-panel px-3 py-2">
      {items.map((i) => (
        <Link key={i.clave} href={i.href} scroll={false} aria-current={i.activo ? "true" : undefined}
          className={cx("flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold transition", i.activo ? "border-ink bg-ink text-white" : "border-line bg-panel text-muted hover:border-ink hover:text-ink")}>
          {i.etiqueta}
          {i.noLeidos > 0 && <span className="rounded-full bg-cta px-1.5 text-[10px] font-bold text-white">{i.noLeidos}</span>}
        </Link>
      ))}
    </nav>
  );
}

type Otro = { nombre: string; iniciales: string; color: string };

/** Mensajes en orden, con separadores por día, avisos del sistema como eventos y «Visto» en los propios. */
function LineaTiempo({ mensajes, yo, otro }: { mensajes: Mensaje[]; yo: "colaborador" | "delegado"; otro: Otro }) {
  const filas: React.ReactNode[] = [];
  let dia = "";
  let anterior = "";
  for (const m of mensajes) {
    const d = diaClave(m.fecha);
    if (d !== dia) {
      filas.push(<li key={`d${m.id}`} className="my-3 flex justify-center"><span className="rounded-full border border-line bg-panel px-3 py-0.5 text-xs font-semibold capitalize text-muted">{etiquetaDia(m.fecha)}</span></li>);
      dia = d; anterior = "";
    }
    if (m.remitente === "sistema") {
      const e = evento(m.texto);
      filas.push(
        <li key={m.id} className="my-2 flex justify-center">
          <p className="flex max-w-[94%] items-center gap-2.5 rounded-xl border border-line border-l-4 border-l-marca bg-panel px-3 py-2 text-[13px]">
            <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sun-50 text-xs font-bold text-cta">{e.icono}</span>
            <span>{e.partes.map((p, i) => p.negrita ? <b key={i}>{p.t}</b> : <span key={i}>{p.t}</span>)} <time dateTime={m.fecha} className="ml-1 text-xs text-faint">{hora(m.fecha)}</time></span>
          </p>
        </li>,
      );
      anterior = "";
      continue;
    }
    const mio = m.remitente === yo;
    const primero = anterior !== m.remitente;
    anterior = m.remitente;
    filas.push(
      <li key={m.id} className={cx("flex flex-col", primero ? "mt-3" : "mt-0.5", mio ? "items-end" : "items-start")}>
        {primero && !mio && <p className="mb-0.5 ml-9 text-xs font-semibold text-muted">{otro.nombre}</p>}
        <div className={cx("flex max-w-[88%] items-end gap-2", mio && "flex-row-reverse")}>
          {!mio && (primero ? <Iniciales texto={otro.iniciales} color={otro.color} pequeno /> : <span className="w-7 shrink-0" />)}
          <div className={cx("rounded-2xl px-3.5 py-2 text-sm", mio ? "bg-ink text-white" : "border border-line bg-panel", primero && (mio ? "rounded-br-md" : "rounded-bl-md"))}>
            <p className="whitespace-pre-wrap break-words">{m.texto}</p>
            <p className={cx("mt-0.5 flex justify-end gap-1.5 text-[11px]", mio ? "text-white/70" : "text-faint")}>
              <time dateTime={m.fecha}>{hora(m.fecha)}</time>
              {mio && <span className={m.leido ? "text-[#7FE3D6]" : undefined}>{m.leido ? "✓✓ Visto" : "✓ Enviado"}</span>}
            </p>
          </div>
        </div>
      </li>,
    );
  }
  return <ol>{filas}</ol>;
}

/** Cabecera + mensajes + caja de escribir de una conversación. `mensajes` va de más antiguo a más reciente. */
export function Conversacion({ cabecera, extra, mensajes, colaboradorId, clienteId, yo, otro, sugerencias, rotulo, placeholder, vacio }: {
  cabecera: React.ReactNode; extra?: React.ReactNode; mensajes: Mensaje[]; colaboradorId: string; clienteId: string | null;
  yo: "colaborador" | "delegado"; otro: Otro; sugerencias?: Sugerencia[]; rotulo?: string; placeholder: string; vacio: string;
}) {
  const clave = `${colaboradorId}:${clienteId ?? "general"}`;
  const ultimo = mensajes[mensajes.length - 1];
  const pendientes = mensajes.filter((m) => !m.leido && (yo === "colaborador" ? m.remitente !== "colaborador" : m.remitente === "colaborador")).length;
  return (
    <div className="flex h-full min-h-0 flex-col bg-soft">
      {cabecera}
      {extra}
      <MarcarLeidos colaboradorId={colaboradorId} clienteId={clienteId} pendientes={pendientes} />
      <FlujoMensajes clave={clave} ultimoId={ultimo?.id ?? null} ultimoMio={ultimo ? ultimo.remitente === yo : false}>
        {mensajes.length === 0
          ? <p className="mx-auto mt-16 max-w-xs text-center text-sm text-muted">{vacio}</p>
          : <LineaTiempo mensajes={mensajes} yo={yo} otro={otro} />}
      </FlujoMensajes>
      <Compositor key={clave} colaboradorId={colaboradorId} clienteId={clienteId} sugerencias={sugerencias} rotulo={rotulo} placeholder={placeholder} />
    </div>
  );
}
