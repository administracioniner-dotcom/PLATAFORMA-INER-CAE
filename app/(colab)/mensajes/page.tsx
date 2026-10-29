import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Hilo, agruparHilos } from "@/components/Hilo";
import { requireColaborador } from "@/lib/auth";
import { cx, fechaHora } from "@/lib/utils";
import type { Mensaje } from "@/lib/types";

export default async function Mensajes({ searchParams }: { searchParams: Promise<{ hilo?: string }> }) {
  const { hilo = "general" } = await searchParams;
  const { supabase, user } = await requireColaborador();
  const [{ data: ms }, { data: cs }] = await Promise.all([
    supabase.from("mensajes").select("*").eq("colaborador_id", user!.id).order("fecha", { ascending: false }).limit(500),
    supabase.from("mis_clientes").select("id,nombre"),
  ]);
  const mensajes = (ms ?? []) as Mensaje[];
  const hilos = agruparHilos(mensajes, cs ?? [], (m) => m.remitente !== "colaborador");
  if (!hilos.some((h) => h.clave === "general")) hilos.unshift({ clave: "general", id: null, titulo: "Conversación general", ultimo: { fecha: new Date().toISOString() } as Mensaje, noLeidos: 0 });
  const clienteId = hilo === "general" ? null : hilo;
  const actual = mensajes.filter((m) => (m.cliente_id ?? null) === clienteId).reverse();

  const ids = actual.filter((m) => !m.leido && m.remitente !== "colaborador").map((m) => m.id);
  if (ids.length) await supabase.from("mensajes").update({ leido: true }).in("id", ids);

  return (
    <>
      <AutoRefresh cada={15} />
      <h1 className="mb-4 text-3xl font-bold tracking-[-0.02em]">Mensajes</h1>
      <div className="tarjeta grid overflow-hidden md:h-[36rem] md:grid-cols-[18rem_1fr]">
        <nav aria-label="Conversaciones" className="max-h-60 overflow-y-auto border-b border-line md:max-h-none md:border-b-0 md:border-r">
          {hilos.map((h) => (
            <Link key={h.clave} href={`/mensajes?hilo=${h.clave}`} className={cx("block border-b border-line px-4 py-3.5 transition-colors hover:bg-soft", h.clave === hilo && "bg-sun-50")}>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-bold">{h.titulo}</span>
                {h.noLeidos > 0 && <span className="rounded-full bg-sun px-1.5 text-[11px] font-black text-white">{h.noLeidos}</span>}
              </span>
              <span className="block truncate text-xs text-muted">{h.ultimo.texto ?? "Escribe a INER"} {h.ultimo.texto ? "· " + fechaHora(h.ultimo.fecha) : ""}</span>
            </Link>
          ))}
        </nav>
        <div className="min-h-[24rem] bg-soft"><Hilo mensajes={actual} colaboradorId={user!.id} clienteId={clienteId} yo="colaborador" /></div>
      </div>
    </>
  );
}
