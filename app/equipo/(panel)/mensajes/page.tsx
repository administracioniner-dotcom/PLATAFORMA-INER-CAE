import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { AutoRefresh } from "@/components/AutoRefresh";
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

  let panel: React.ReactNode = <div className="grid h-full place-items-center p-8 text-muted">Elige un colaborador para ver sus conversaciones.</div>;
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
        <nav aria-label="Conversaciones" className="max-h-48 overflow-y-auto border-b border-line md:max-h-none md:border-b-0 md:border-r">
          {hilos.map((h) => (
            <Link key={h.clave} href={`/equipo/mensajes?c=${c}&hilo=${h.clave}`} className={cx("block border-b border-line px-3 py-2.5 text-sm hover:bg-soft", h.clave === hilo && "bg-sun-50")}>
              <span className="flex justify-between gap-2"><span className="truncate font-semibold">{h.titulo}</span>{h.noLeidos > 0 && <span className="rounded-full bg-cta px-1.5 text-[11px] font-bold text-white">{h.noLeidos}</span>}</span>
              {h.ultimo.texto && <span className="block truncate text-xs text-muted">{fechaHora(h.ultimo.fecha)}</span>}
            </Link>
          ))}
        </nav>
        <div className="min-h-[24rem] bg-soft"><Hilo mensajes={actual} colaboradorId={c} clienteId={clienteId} yo="delegado" /></div>
      </div>
    );
  }

  return (
    <>
      <AutoRefresh cada={15} />
      <h1 className="mb-4 text-3xl font-bold tracking-[-0.02em]">Mensajes</h1>
      <div className="tarjeta grid overflow-hidden md:h-[36rem] md:grid-cols-[17rem_1fr]">
      <nav aria-label="Colaboradores" className="max-h-52 overflow-y-auto border-b border-line md:max-h-none md:border-b-0 md:border-r">
        {colabs.map((x) => (
          <Link key={x.id} href={`/equipo/mensajes?c=${x.id}`} className={cx("flex items-center justify-between gap-2 border-b border-line px-4 py-3 hover:bg-soft", x.id === c && "bg-sun-50")}>
            <span className="flex min-w-0 items-center gap-2.5"><Avatar nombre={x.nombre ?? x.email} tamano="sm" /><span className="truncate font-bold">{x.nombre ?? x.email}</span></span>
            {!!sinLeer.get(x.id) && <span className="rounded-full bg-cta px-1.5 text-[11px] font-bold text-white">{sinLeer.get(x.id)}</span>}
          </Link>
        ))}
        {colabs.length === 0 && <p className="p-4 text-sm text-muted">Aún no hay colaboradores.</p>}
      </nav>
      {panel}
      </div>
    </>
  );
}
