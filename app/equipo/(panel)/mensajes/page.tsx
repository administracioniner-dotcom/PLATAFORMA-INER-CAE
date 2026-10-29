import Link from "next/link";
import { Hilo, agruparHilos } from "@/components/Hilo";
import { requireStaff } from "@/lib/auth";
import { cx, fechaHora } from "@/lib/utils";
import type { Mensaje, Profile } from "@/lib/types";

export default async function MensajesEquipo({ searchParams }: { searchParams: Promise<{ c?: string; hilo?: string }> }) {
  const { c, hilo = "general" } = await searchParams;
  const { supabase } = await requireStaff();
  const [{ data: ps }, { data: ms }] = await Promise.all([
    supabase.from("profiles").select("id,nombre,email").eq("rol", "colaborador").order("nombre"),
    supabase.from("mensajes").select("colaborador_id,leido,remitente,fecha").order("fecha", { ascending: false }).limit(2000),
  ]);
  const colabs = (ps ?? []) as Pick<Profile, "id" | "nombre" | "email">[];
  const sinLeer = new Map<string, number>();
  for (const m of ms ?? []) if (!m.leido && m.remitente === "colaborador") sinLeer.set(m.colaborador_id, (sinLeer.get(m.colaborador_id) ?? 0) + 1);

  let panel: React.ReactNode = <div className="grid h-full place-items-center p-8 text-navy/60">Elige un colaborador para ver sus conversaciones.</div>;
  if (c && colabs.some((x) => x.id === c)) {
    const [{ data: mm }, { data: cs }] = await Promise.all([
      supabase.from("mensajes").select("*").eq("colaborador_id", c).order("fecha", { ascending: false }).limit(500),
      supabase.from("clientes").select("id,nombre").eq("colaborador_id", c),
    ]);
    const mensajes = (mm ?? []) as Mensaje[];
    const hilos = agruparHilos(mensajes, cs ?? [], (m) => m.remitente === "colaborador");
    if (!hilos.some((h) => h.clave === "general")) hilos.unshift({ clave: "general", id: null, titulo: "Conversación general", ultimo: { fecha: new Date().toISOString() } as Mensaje, noLeidos: 0 });
    const clienteId = hilo === "general" ? null : hilo;
    const actual = mensajes.filter((m) => (m.cliente_id ?? null) === clienteId).reverse();
    const ids = actual.filter((m) => !m.leido && m.remitente === "colaborador").map((m) => m.id);
    if (ids.length) await supabase.from("mensajes").update({ leido: true }).in("id", ids);
    panel = (
      <div className="grid h-full md:grid-cols-[14rem_1fr]">
        <nav aria-label="Conversaciones" className="max-h-48 overflow-y-auto border-b border-navy/10 md:max-h-none md:border-b-0 md:border-r">
          {hilos.map((h) => (
            <Link key={h.clave} href={`/equipo/mensajes?c=${c}&hilo=${h.clave}`} className={cx("block border-b border-navy/10 px-3 py-2.5 text-sm hover:bg-navy-50", h.clave === hilo && "bg-navy-50")}>
              <span className="flex justify-between gap-2"><span className="truncate font-semibold">{h.titulo}</span>{h.noLeidos > 0 && <span className="rounded-full bg-ambar px-1.5 text-[11px] font-bold">{h.noLeidos}</span>}</span>
              {h.ultimo.texto && <span className="block truncate text-xs text-navy/60">{fechaHora(h.ultimo.fecha)}</span>}
            </Link>
          ))}
        </nav>
        <div className="min-h-[24rem] bg-navy-50"><Hilo mensajes={actual} colaboradorId={c} clienteId={clienteId} yo="delegado" /></div>
      </div>
    );
  }

  return (
    <div className="grid overflow-hidden rounded-2xl bg-white ring-1 ring-navy/10 md:h-[36rem] md:grid-cols-[16rem_1fr]">
      <nav aria-label="Colaboradores" className="max-h-52 overflow-y-auto border-b border-navy/10 md:max-h-none md:border-b-0 md:border-r">
        {colabs.map((x) => (
          <Link key={x.id} href={`/equipo/mensajes?c=${x.id}`} className={cx("flex items-center justify-between gap-2 border-b border-navy/10 px-4 py-3 hover:bg-navy-50", x.id === c && "bg-navy-50")}>
            <span className="truncate font-semibold">{x.nombre ?? x.email}</span>
            {!!sinLeer.get(x.id) && <span className="rounded-full bg-ambar px-1.5 text-[11px] font-bold">{sinLeer.get(x.id)}</span>}
          </Link>
        ))}
        {colabs.length === 0 && <p className="p-4 text-sm text-navy/60">Aún no hay colaboradores.</p>}
      </nav>
      {panel}
    </div>
  );
}
