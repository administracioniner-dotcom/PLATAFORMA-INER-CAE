import { AutoRefresh } from "@/components/AutoRefresh";
import { CabeceraConversacion, Conversacion } from "@/components/mensajes/Conversacion";
import { ListaConversaciones, type ItemLista } from "@/components/mensajes/ListaConversaciones";
import type { Sugerencia } from "@/components/mensajes/Compositor";
import { conversaciones } from "@/lib/mensajes";
import { requireColaborador } from "@/lib/auth";
import { FASES, FASE_COLOR, cx, eur, fechaLista, iniciales } from "@/lib/utils";
import type { Mensaje } from "@/lib/types";

// Lo que el colaborador no puede hacer solo y debe pedir a INER (coincide con la sección de Soporte).
const SUGERENCIAS: Sugerencia[] = [
  { etiqueta: "Pedir el alta de un cliente", relleno: "Hola, me gustaría dar de alta un cliente nuevo.\nNombre: \nContacto: " },
  { etiqueta: "Cambiar mi nombre", relleno: "Hola, necesito cambiar el nombre con el que estoy registrado a: " },
  { etiqueta: "Duda sobre un pago", relleno: "Hola, tengo una duda sobre el pago de: " },
];

export default async function Mensajes({ searchParams }: { searchParams: Promise<{ hilo?: string }> }) {
  const { hilo } = await searchParams;
  const { supabase, user } = await requireColaborador();
  const [{ data: ms }, { data: cs }] = await Promise.all([
    supabase.from("mensajes").select("*").eq("colaborador_id", user!.id).order("fecha", { ascending: false }).limit(500),
    supabase.from("mis_clientes").select("id,nombre,fase,pago,comision"),
  ]);
  const mensajes = (ms ?? []) as Mensaje[];
  const clientes = (cs ?? []) as { id: string; nombre: string; fase: number; pago: "none" | "requested" | "paid"; comision: number | null }[];
  const convs = conversaciones(mensajes, clientes, (m) => m.remitente !== "colaborador", (m) => m.remitente === "colaborador");
  const elegida = hilo ? convs.find((c) => c.clave === hilo) : undefined;
  // En escritorio se ve siempre una conversación (la que tiene mensajes sin leer o la más reciente); en móvil, la lista hasta que se toca una.
  const actual = elegida ?? convs.find((c) => c.noLeidos > 0) ?? convs[0];
  const vista = elegida ? "chat" : "lista";
  const cliente = clientes.find((c) => c.id === actual.clienteId);
  const hiloActual = mensajes.filter((m) => (m.cliente_id ?? null) === actual.clienteId).reverse();

  const items: ItemLista[] = convs.map((c) => ({
    clave: c.clave, href: `/mensajes?hilo=${c.clave}`, titulo: c.titulo,
    subtitulo: c.ultimoTexto ? `${c.ultimoMio ? "Tú: " : ""}${c.ultimoTexto}` : c.clienteId ? "Escribe a INER sobre este cliente" : "Escribe a INER",
    hora: c.ultimoFecha ? fechaLista(c.ultimoFecha) : "", noLeidos: c.noLeidos,
    color: c.fase != null ? FASE_COLOR[c.fase] : "#021037", iniciales: c.clienteId ? iniciales(c.titulo) : "IN", activo: c.clave === actual.clave,
  }));

  return (
    <>
      <AutoRefresh cada={30} />
      <h1 className="mb-3 text-3xl font-bold tracking-[-0.02em]">Mensajes</h1>
      <div className="tarjeta grid h-[calc(100dvh-11rem)] min-h-[28rem] overflow-hidden md:grid-cols-[19rem_minmax(0,1fr)]">
        <div className={cx("min-h-0 flex-col border-line md:flex md:border-r", vista === "chat" ? "hidden" : "flex")}>
          <ListaConversaciones items={items} buscar="Buscar conversación" etiquetaPendientes="Sin leer" />
        </div>
        <div className={cx("min-h-0 md:block", vista === "lista" ? "hidden" : "block")}>
          <Conversacion
            clienteId={actual.clienteId} colaboradorId={user!.id} yo="colaborador" mensajes={hiloActual}
            otro={{ nombre: "INER", iniciales: "IN", color: "#021037" }}
            sugerencias={SUGERENCIAS} placeholder="Escribe un mensaje a INER"
            vacio={actual.clienteId ? "Todavía no hay mensajes sobre este cliente. Escribe el primero." : "Todavía no hay mensajes aquí. Escribe el primero."}
            cabecera={
              <CabeceraConversacion
                volverHref="/mensajes" iniciales={cliente ? iniciales(cliente.nombre) : "IN"} color={cliente ? FASE_COLOR[cliente.fase] : "#021037"}
                titulo={actual.titulo} subtitulo={cliente ? "Cliente que nos has pasado" : "Habla con el equipo de INER"}
                estado={cliente ? (cliente.pago === "paid" ? "Pagado" : cliente.pago === "requested" ? "Pago solicitado" : FASES[cliente.fase]) : undefined}
                tono={cliente && (cliente.fase === 4 || cliente.pago === "paid") ? "batt" : "net"}
                dato={cliente && cliente.comision != null ? `Comisión ${eur(cliente.comision)}` : undefined}
                verHref={cliente ? "/#clientes" : undefined}
              />
            }
          />
        </div>
      </div>
    </>
  );
}
