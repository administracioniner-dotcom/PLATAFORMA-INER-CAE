"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { anadirObservacion, borrarObservacion, cambiarCobroDirecto, contrasenaCliente, crearClienteDirecto, darAccesoCliente, quitarAccesoCliente, eliminarClienteDirecto, guardarClienteDirecto, guardarFechaDocumento, marcarDocumento, moverFaseDirecto } from "@/app/actions";
import { BotonBorrar } from "@/components/BotonBorrar";
import { CampoContrasena } from "@/components/CampoContrasena";
import { FormAviso } from "@/components/FormAviso";
import { Submit } from "@/components/Submit";
import { avisar } from "@/lib/avisar";
import type { ClienteDirecto, FichaDoc, FichaTipo, MarcaDoc, ObsFase } from "@/lib/types";
import { FASES, FASE_COLOR, cx, eur, eur0, fecha, fechaHora, num, FASE_FINAL } from "@/lib/utils";

const FILTROS = [["todos", "Todos"], ["tram", "En tramitación"], ["pend", "Por pagar"], ["ok", "Pagados"], ["docs", "Faltan documentos"]] as const;
const ORDENES = [["rec", "Más recientes"], ["nom", "Nombre (A-Z)"], ["fase", "Fase (más avanzada)"], ["imp", "Importe (mayor)"], ["docs", "Documentos que faltan"]] as const;
type Filtro = (typeof FILTROS)[number][0];
type Orden = (typeof ORDENES)[number][0];
const CLAVE_ESTADO = "iner-mis-clientes";
const clave = (c: string, d: string) => `${c}:${d}`;
const mapa = (ms: MarcaDoc[]) => new Map(ms.map((m) => [clave(m.cliente_id, m.documento_id), m]));
const importe = (c: ClienteDirecto) => (c.mwh == null ? null : c.mwh * c.precio_mwh);
const estado = (c: ClienteDirecto) => (c.cobrado_at ? "ok" : c.fase === FASE_FINAL ? "pend" : "tram");
const viejo = (iso: string | null | undefined, anios: number) => { if (!iso) return false; const l = new Date(); l.setFullYear(l.getFullYear() - anios); return new Date(iso) < l; };

export function MisClientes({ fichas, docs, clientes, marcas, obs, esAdmin }: { fichas: FichaTipo[]; docs: FichaDoc[]; clientes: ClienteDirecto[]; marcas: MarcaDoc[]; obs: ObsFase[]; esAdmin: boolean }) {
  const [m, setM] = useState(() => mapa(marcas));
  useEffect(() => setM(mapa(marcas)), [marcas]);
  const [vista, setVista] = useState<"lista" | "tablero">("lista");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState<Orden>("rec");
  const [modo, setModo] = useState<"todos" | "faltan">("todos");
  const [sel, setSel] = useState<string | null>(null);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [pestana, setPestana] = useState<"docs" | "fases" | "datos" | "acceso">("docs");
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [claveNuevo, setClaveNuevo] = useState(0);
  const [fichaSel, setFichaSel] = useState<Record<string, string>>({});
  /** Correo y contraseña recién creados: se enseñan una sola vez para poder pasárselos al cliente. */
  const [recien, setRecien] = useState<Record<string, { email: string; password: string }>>({});

  // El filtro, el orden, la vista y el modo de documentos se recuerdan en este navegador.
  const cargado = useRef(false);
  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE_ESTADO) ?? "{}");
      if (FILTROS.some(([k]) => k === g.filtro)) setFiltro(g.filtro);
      if (ORDENES.some(([k]) => k === g.orden)) setOrden(g.orden);
      if (g.vista === "lista" || g.vista === "tablero") setVista(g.vista);
      if (g.modo === "todos" || g.modo === "faltan") setModo(g.modo);
    } catch { /* sin almacenamiento: se usan los valores de partida */ }
    cargado.current = true;
  }, []);
  useEffect(() => {
    if (!cargado.current) return;
    try { localStorage.setItem(CLAVE_ESTADO, JSON.stringify({ filtro, orden, vista, modo })); } catch { /* idem */ }
  }, [filtro, orden, vista, modo]);

  const ficha = useMemo(() => new Map(fichas.map((f) => [f.id, f])), [fichas]);
  const docsDe = useMemo(() => {
    const r = new Map<string, FichaDoc[]>();
    for (const d of [...docs].sort((a, b) => a.orden - b.orden)) r.set(d.ficha_id, [...(r.get(d.ficha_id) ?? []), d]);
    return r;
  }, [docs]);
  const lista = (c: ClienteDirecto) => docsDe.get(c.ficha_id) ?? [];
  const listo = (c: ClienteDirecto, d: FichaDoc) => !!m.get(clave(c.id, d.id))?.listo;
  const hecho = (c: ClienteDirecto) => lista(c).filter((d) => listo(c, d)).length;
  const faltan = (c: ClienteDirecto) => lista(c).length - hecho(c);
  /** Documentos con fecha cuya antigüedad pasa del límite de su ficha. */
  const caducados = (c: ClienteDirecto) => lista(c).filter((d) => d.aviso_anios && viejo(m.get(clave(c.id, d.id))?.fecha, d.aviso_anios));

  const suma = (cs: ClienteDirecto[]) => cs.reduce((a, c) => a + (importe(c) ?? 0), 0);
  const pagados = clientes.filter((c) => estado(c) === "ok");
  const porPagar = clientes.filter((c) => estado(c) === "pend");
  const enTramite = clientes.filter((c) => estado(c) === "tram");
  const cuenta = (k: Filtro) => clientes.filter((c) => k === "todos" || (k === "docs" ? faltan(c) > 0 : estado(c) === k)).length;

  const visibles = clientes
    .filter((c) => (filtro === "todos" || (filtro === "docs" ? faltan(c) > 0 : estado(c) === filtro)) && c.nombre.toLowerCase().includes(q.trim().toLowerCase()))
    .sort({
      rec: (a: ClienteDirecto, b: ClienteDirecto) => b.created_at.localeCompare(a.created_at),
      nom: (a: ClienteDirecto, b: ClienteDirecto) => a.nombre.localeCompare(b.nombre, "es"),
      fase: (a: ClienteDirecto, b: ClienteDirecto) => b.fase - a.fase,
      imp: (a: ClienteDirecto, b: ClienteDirecto) => (importe(b) ?? -1) - (importe(a) ?? -1),
      docs: (a: ClienteDirecto, b: ClienteDirecto) => faltan(b) - faltan(a),
    }[orden]);
  const actual = clientes.find((c) => c.id === sel) ?? visibles[0] ?? null;

  /** Marca o desmarca al momento y lo guarda; si el servidor lo rechaza, vuelve atrás y avisa. */
  async function alternar(c: ClienteDirecto, d: FichaDoc, valor: boolean) {
    const antes = m;
    const sig = new Map(m);
    const poner = (id: string, v: boolean) => { const k = clave(c.id, id); sig.set(k, { cliente_id: c.id, documento_id: id, listo: v, fecha: sig.get(k)?.fecha ?? null }); };
    poner(d.id, valor);
    if (!valor) lista(c).filter((x) => x.depende_de === d.id).forEach((x) => poner(x.id, false));
    setM(sig);
    const r = await marcarDocumento(c.id, d.id, valor);
    if (r?.error) { setM(antes); avisar(r.error, "error"); }
  }
  async function ponerFecha(c: ClienteDirecto, d: FichaDoc, valor: string) {
    const antes = m;
    const sig = new Map(m);
    const k = clave(c.id, d.id);
    sig.set(k, { cliente_id: c.id, documento_id: d.id, listo: sig.get(k)?.listo ?? false, fecha: valor || null });
    setM(sig);
    const r = await guardarFechaDocumento(c.id, d.id, valor);
    if (r?.error) { setM(antes); avisar(r.error, "error"); }
  }
  /** «Marcar pagado» desde la propia fila. */
  async function cobrar(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    const r = await cambiarCobroDirecto(fd);
    if (r?.error) avisar(r.error, "error"); else avisar(r?.ok ?? "Marcado como pagado");
  }
  const abrir = (id: string) => { setSel(id); setPanelAbierto(true); setPestana("docs"); };

  const cobro = (c: ClienteDirecto) => {
    const e = estado(c);
    return e === "ok" ? <span className="whitespace-nowrap rounded-full bg-batt-50 px-2.5 py-0.5 text-xs font-bold text-batt-700">Pagado {fecha(c.cobrado_at)}</span>
      : e === "pend" ? <span className="whitespace-nowrap rounded-full bg-sun-50 px-2.5 py-0.5 text-xs font-bold text-sun-700">Por pagar</span>
      : <span className="whitespace-nowrap rounded-full bg-net-50 px-2.5 py-0.5 text-xs font-bold text-net-700">En tramitación</span>;
  };
  const etiqueta = (c: ClienteDirecto) => <span className="rounded-md bg-net-50 px-2 py-0.5 text-xs font-bold tracking-wide text-net-700">{ficha.get(c.ficha_id)?.codigo ?? "—"}</span>;
  const tramos = (c: ClienteDirecto) => (
    <span className="inline-flex gap-[3px]" aria-hidden>{FASES.map((_, i) => <i key={i} className="h-1.5 w-[13px] rounded-full" style={{ background: i <= c.fase ? FASE_COLOR[c.fase] : "#E5E7EB" }} />)}</span>
  );
  /** «Falta: …» con el primer documento pendiente. */
  const falta = (c: ClienteDirecto) => {
    const ds = lista(c);
    if (ds.length === 0) return <span className="text-sm text-muted">Sin documentos en la ficha</span>;
    const p = ds.filter((d) => !listo(c, d));
    if (p.length === 0) return <span className="text-sm font-semibold text-batt-700">✓ Documentos listos</span>;
    return <span className="min-w-0 text-sm"><span className="text-muted">Falta:</span> {p[0].nombre}{p.length > 1 && <span className="text-muted"> (+{p.length - 1} más)</span>}</span>;
  };

  function panel(c: ClienteDirecto) {
    const ds = lista(c);
    const pend = ds.filter((d) => !listo(c, d));
    const vis = modo === "faltan" ? pend : ds;
    const grupos = ds.reduce<{ grupo: string; items: FichaDoc[]; completo: boolean }[]>((a, d) => {
      if (!vis.includes(d)) return a;
      const g = a.find((x) => x.grupo === d.grupo);
      if (g) g.items.push(d); else a.push({ grupo: d.grupo, items: [d], completo: ds.filter((x) => x.grupo === d.grupo).every((x) => listo(c, x)) });
      return a;
    }, []);
    const sel2 = fichaSel[c.id] ?? c.ficha_id;
    return (
      <>
        <div className="border-b border-line px-4 pb-3 pt-4">
          <button type="button" onClick={() => setPanelAbierto(false)} className="btn btn-ghost mb-3 !px-3 !py-1 lg:hidden">← Volver a la lista</button>
          <h2 className="text-xl font-bold leading-tight">{c.nombre}</h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-2">{etiqueta(c)}{tramos(c)}<span className="text-sm text-muted">{FASES[c.fase]}</span>{cobro(c)}</p>
          <p className="mt-1.5 text-sm text-muted">{c.mwh == null ? <span className="font-semibold text-sun-700">Sin MWh todavía</span> : <><span className="font-mono">{num(c.mwh)} MWh × {num(c.precio_mwh)} €/MWh</span> = <span className="num text-ink">{eur(importe(c))}</span></>} · Alta {fecha(c.created_at)}</p>
        </div>
        <div role="tablist" className="flex gap-1 border-b border-line px-3 pt-2">
          {([["docs", "Documentos"], ["fases", "Fases"], ["datos", "Datos"], ["acceso", "Acceso"]] as const).map(([k, t]) => (
            <button key={k} role="tab" type="button" aria-selected={pestana === k} onClick={() => setPestana(k)}
              className={cx("-mb-px border-b-[3px] px-3 py-1.5 text-sm font-semibold", pestana === k ? "border-marca text-ink" : "border-transparent text-muted hover:text-ink")}>{t}</button>
          ))}
        </div>

        <div className="max-h-[30rem] overflow-y-auto px-4 py-3 max-lg:max-h-none">
          {pestana === "docs" ? (
            <>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted"><b className="text-ink">{hecho(c)} de {ds.length}</b> listos{pend.length > 0 && ` · faltan ${pend.length}`}</p>
                <div className="flex rounded-full bg-soft p-0.5" role="group" aria-label="Qué documentos ver">
                  {([["faltan", "Faltan"], ["todos", "Todos"]] as const).map(([k, t]) => (
                    <button key={k} type="button" aria-pressed={modo === k} onClick={() => setModo(k)}
                      className={cx("rounded-full px-3 py-0.5 text-sm font-semibold", modo === k ? "bg-ink text-white" : "text-muted")}>{t}</button>
                  ))}
                </div>
              </div>
              {ds.length === 0 && <p className="py-4 text-sm text-muted">Esta ficha todavía no tiene documentos.{esAdmin && <> <Link href="/equipo/mis-clientes/fichas" className="font-semibold text-net-700 underline underline-offset-2">Añádelos aquí</Link>.</>}</p>}
              {ds.length > 0 && modo === "faltan" && pend.length === 0 && <p className="mt-2 rounded-xl bg-batt-50 p-3.5 text-center text-sm font-semibold text-batt-700">✓ No falta ningún documento</p>}
              {grupos.map((g) => (
                <div key={g.grupo} className="mt-3">
                  <h3 className={cx("text-[11.5px] font-semibold uppercase tracking-[.05em]", g.completo ? "text-batt-700" : "text-faint")}>{g.grupo}{g.completo && " ✓"}</h3>
                  {g.items.map((d) => {
                    const dep = d.depende_de ? ds.find((x) => x.id === d.depende_de) : null;
                    const bloq = !!dep && !listo(c, dep);
                    const id = `doc-${c.id}-${d.id}`;
                    const fch = m.get(clave(c.id, d.id))?.fecha ?? "";
                    return (
                      <div key={d.id}>
                        <label htmlFor={id} className={cx("-mx-2 grid grid-cols-[auto_1fr] gap-x-2.5 rounded-xl px-2 py-2", bloq ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:bg-soft")}>
                          <input id={id} type="checkbox" checked={listo(c, d)} disabled={bloq} onChange={(e) => alternar(c, d, e.target.checked)} className="mt-0.5 h-5 w-5 accent-batt" />
                          <span className="text-sm font-semibold">{d.nombre}</span>
                          {(d.ayuda || bloq) && <span className="col-start-2 text-xs text-muted">{d.ayuda}{bloq && ` Se desbloquea al marcar «${dep?.nombre}».`}</span>}
                        </label>
                        {d.aviso_anios && (
                          <div className="mb-1 ml-[1.9rem] flex flex-wrap items-center gap-2 text-xs text-muted">
                            <label htmlFor={`${id}-f`}>Fecha</label>
                            <input id={`${id}-f`} type="date" value={fch} onChange={(e) => ponerFecha(c, d, e.target.value)} className="rounded-full border border-line bg-panel px-3 py-1 text-sm text-ink" />
                            {viejo(fch, d.aviso_anios) && <span className="rounded-full bg-sun-50 px-2.5 py-0.5 font-semibold text-sun-700">⚠ Verificar: más de {d.aviso_anios} {d.aviso_anios === 1 ? "año" : "años"}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          ) : pestana === "fases" ? (
            <>
              <p className="mb-2 rounded-xl bg-sun-50 px-3 py-2 text-xs text-sun-700">Lo que escribas aquí <b>lo ve el cliente</b>, justo debajo de cada fase. Escríbelo pensando en él.</p>
              <ol className="space-y-3">
                {FASES.map((nombre, i) => {
                  const lista = obs.filter((o) => o.cliente_id === c.id && o.fase === i);
                  const estadoFase = i < c.fase ? "hecha" : i === c.fase ? "ahora" : "pendiente";
                  return (
                    <li key={nombre} className="rounded-xl border border-line p-3">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                        <span className="grid h-6 w-6 place-items-center rounded-full text-xs text-white" style={{ background: estadoFase === "pendiente" ? "#9CA3AF" : FASE_COLOR[i] }}>{estadoFase === "hecha" ? "✓" : i + 1}</span>
                        {nombre}
                        {estadoFase === "ahora" && <span className="rounded-full bg-sun-50 px-2 py-0.5 text-xs text-sun-700">Fase actual</span>}
                      </p>
                      {lista.map((o) => (
                        <div key={o.id} className="mt-2 flex items-start justify-between gap-2 rounded-lg bg-soft px-3 py-2 text-sm">
                          <span><span className="block">{o.texto}</span><span className="text-xs text-faint">{fechaHora(o.created_at)}</span></span>
                          <FormAviso action={borrarObservacion}><input type="hidden" name="id" value={o.id} /><button aria-label="Borrar observación" className="text-xs font-semibold text-net-700 underline underline-offset-2">Borrar</button></FormAviso>
                        </div>
                      ))}
                      <FormAviso action={anadirObservacion} className="mt-2 flex gap-2">
                        <input type="hidden" name="id" value={c.id} /><input type="hidden" name="fase" value={i} />
                        <label className="sr-only" htmlFor={`ob-${c.id}-${i}`}>Observación de {nombre}</label>
                        <input id={`ob-${c.id}-${i}`} name="texto" required maxLength={1000} placeholder="Añadir una observación…" className="input !py-1.5" />
                        <Submit className="btn btn-ghost !px-4 !py-1.5" pendiente="…">Añadir</Submit>
                      </FormAviso>
                    </li>
                  );
                })}
              </ol>
            </>
          ) : pestana === "acceso" ? (
            <>
              {c.usuario_id ? (
                <div className="space-y-4">
                  <p className="rounded-xl bg-batt-50 px-3 py-2 text-sm text-batt-700">✓ Este cliente tiene acceso al portal con <b>{c.email}</b>.</p>
                  {recien[c.id] && (
                    <div className="rounded-xl border border-sun/40 bg-sun-50 p-3 text-sm">
                      <p className="font-bold">Envíaselo al cliente ahora: la contraseña no se vuelve a mostrar</p>
                      <p className="mt-1 select-all break-all"><span className="text-muted">Enlace:</span> https://plataforma-iner-cae.vercel.app/cliente/login</p>
                      <p className="select-all break-all"><span className="text-muted">Correo:</span> {recien[c.id].email}</p>
                      <p className="select-all break-all font-mono"><span className="font-sans text-muted">Contraseña:</span> {recien[c.id].password}</p>
                    </div>
                  )}
                  <p className="text-sm text-muted">Entra en la dirección del portal de clientes. Ve su proyecto, las fases con tus observaciones, lo que falta y lo que se le va a pagar.</p>
                  <FormAviso className="space-y-2" action={async (fd) => {
                    const r = await contrasenaCliente(fd);
                    if (!r?.error && c.email) setRecien((x) => ({ ...x, [c.id]: { email: c.email as string, password: String(fd.get("password") ?? "") } }));
                    return r;
                  }}>
                    <input type="hidden" name="id" value={c.id} />
                    <p className="text-sm font-bold">Restablecer su contraseña <span className="font-normal text-muted">· cópiala antes de guardar: no se vuelve a mostrar</span></p>
                    <CampoContrasena id={`pw-${c.id}`} compacto />
                    <Submit className="btn-primary !py-1.5" pendiente="Guardando…">Guardar contraseña nueva</Submit>
                  </FormAviso>
                  <BotonBorrar action={quitarAccesoCliente} campos={{ id: c.id }} boton="Quitar el acceso…" confirmar="Sí, quitar"
                    aviso="Su cuenta se borra y deja de poder entrar. La ficha, los documentos y las observaciones se conservan." />
                </div>
              ) : (
                <FormAviso className="space-y-3" action={async (fd) => {
                  const r = await darAccesoCliente(fd);
                  if (!r?.error) setRecien((x) => ({ ...x, [c.id]: { email: String(fd.get("email") ?? "").trim().toLowerCase(), password: String(fd.get("password") ?? "") } }));
                  return r;
                }}>
                  <input type="hidden" name="id" value={c.id} />
                  <p className="text-sm text-muted">Crea el acceso del cliente. Pones tú el correo y la contraseña; él entra directamente, sin esperar ningún correo.</p>
                  <label className="block text-xs text-muted" htmlFor={`ae-${c.id}`}>Correo del cliente<input id={`ae-${c.id}`} name="email" type="email" required maxLength={254} className="input mt-1 !py-1.5" /></label>
                  <CampoContrasena id={`ap-${c.id}`} />
                  <Submit className="btn-primary !py-1.5" pendiente="Creando…">Crear acceso</Submit>
                </FormAviso>
              )}
            </>
          ) : (
            <>
              <FormAviso action={guardarClienteDirecto} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={c.id} />
                <label className="text-xs text-muted sm:col-span-2" htmlFor={`n-${c.id}`}>Nombre del cliente<input id={`n-${c.id}`} name="nombre" required maxLength={200} defaultValue={c.nombre} className="input mt-1 !py-1.5" /></label>
                <label className="text-xs text-muted sm:col-span-2" htmlFor={`f-${c.id}`}>Tipo de ficha
                  <select id={`f-${c.id}`} name="ficha_id" value={sel2} onChange={(e) => setFichaSel({ ...fichaSel, [c.id]: e.target.value })} className="input mt-1 !py-1.5">
                    {fichas.map((x) => <option key={x.id} value={x.id}>{x.codigo} · {x.nombre}</option>)}
                  </select>
                  {sel2 !== c.ficha_id && <span className="mt-1 block font-semibold text-sun-700">Con otra ficha los documentos son otros: se pierden los que tenías marcados.</span>}
                </label>
                <label className="text-xs text-muted" htmlFor={`m-${c.id}`}>MWh<input id={`m-${c.id}`} name="mwh" inputMode="decimal" defaultValue={c.mwh ?? ""} className="input mt-1 !py-1.5 font-mono" /></label>
                <label className="text-xs text-muted" htmlFor={`p-${c.id}`}>€ por MWh<input id={`p-${c.id}`} name="precio_mwh" inputMode="decimal" required defaultValue={c.precio_mwh} className="input mt-1 !py-1.5 font-mono" /></label>
                <Submit className="btn-primary !py-1.5 sm:col-span-2" pendiente="Guardando…">Guardar</Submit>
              </FormAviso>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-soft px-4 py-3">
          <FormAviso action={moverFaseDirecto}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="-1" /><button disabled={c.fase === 0} className="btn btn-ghost !px-4 !py-1.5">← Fase anterior</button></FormAviso>
          <FormAviso action={moverFaseDirecto}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="1" /><button disabled={c.fase === FASE_FINAL} className="btn btn-ghost !px-4 !py-1.5">Fase siguiente →</button></FormAviso>
          {c.fase === FASE_FINAL && !c.cobrado_at && <FormAviso action={cambiarCobroDirecto}><input type="hidden" name="id" value={c.id} /><button className="btn btn-primary !px-4 !py-1.5">Marcar pagado</button></FormAviso>}
          {c.cobrado_at && <FormAviso action={cambiarCobroDirecto}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="accion" value="quitar" /><button className="text-xs font-semibold text-net-700 underline underline-offset-2">Quitar el pago</button></FormAviso>}
          <div className="ml-auto"><BotonBorrar action={eliminarClienteDirecto} campos={{ id: c.id }} boton="Eliminar cliente…"
            aviso={`Se borran el cliente${c.usuario_id ? ", su acceso al portal" : ""} y sus documentos marcados${c.cobrado_at ? ", y se pierde un pago ya registrado" : ""}. No se puede deshacer.`} /></div>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow !mb-0">Equipo INER</p>
          <h1 className="text-3xl font-bold tracking-[-0.02em]">Mis clientes</h1>
          <p className="text-muted">Los clientes que llevas directamente, sin colaborador: ficha, documentos, fases y pago.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {esAdmin && <Link href="/equipo/mis-clientes/fichas" className="btn btn-ghost">Gestionar fichas</Link>}
          <button type="button" onClick={() => setNuevoAbierto(!nuevoAbierto)} aria-expanded={nuevoAbierto} aria-controls="nuevo-cliente" className="btn btn-primary">+ Nuevo cliente</button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen">
        <div className="flex flex-col justify-center rounded-2xl bg-ink px-5 py-3 text-white">
          <p className="etiqueta !text-white/75">Pagado hasta hoy</p>
          <p className="num text-3xl leading-tight">{eur(suma(pagados))}</p>
          <p className="text-xs text-white/80">{pagados.length} cliente{pagados.length === 1 ? "" : "s"} pagado{pagados.length === 1 ? "" : "s"}</p>
        </div>
        <div className="tarjeta flex flex-col justify-center px-4 py-3">
          <p className="etiqueta">Pendiente de pagar</p>
          <p className="num text-2xl leading-tight text-sun-700">{eur(suma(porPagar))}</p>
          <p className="text-xs text-muted">{porPagar.length} con CAE expedido, sin pagar</p>
        </div>
        <div className="tarjeta flex flex-col justify-center px-4 py-3">
          <p className="etiqueta">En tramitación</p>
          <p className="num text-2xl leading-tight text-net-700">{eur(suma(enTramite))}</p>
          <p className="text-xs text-muted">{enTramite.length} sin CAE expedido</p>
        </div>
      </section>

      {nuevoAbierto && (
        <div id="nuevo-cliente" className="tarjeta p-4">
          {fichas.length === 0
            ? <p className="text-sm text-muted">Primero hace falta una ficha.{esAdmin ? <> <Link href="/equipo/mis-clientes/fichas" className="font-semibold text-net-700 underline underline-offset-2">Créala aquí</Link>.</> : " Pídele a un administrador que la cree."}</p>
            : (
              <FormAviso key={claveNuevo} action={crearClienteDirecto} alTerminar={(bien) => { if (bien) { setClaveNuevo((k) => k + 1); setNuevoAbierto(false); } }} className="flex flex-wrap items-end gap-3">
                <label className="min-w-[12rem] flex-1 text-xs text-muted" htmlFor="nc-nombre">Nombre o razón social<input id="nc-nombre" name="nombre" required maxLength={200} autoFocus placeholder="Empieza en «Cálculo de CAEs»" className="input mt-1" /></label>
                <label className="min-w-[12rem] flex-1 text-xs text-muted" htmlFor="nc-ficha">Tipo de ficha<select id="nc-ficha" name="ficha_id" className="input mt-1">{fichas.map((f) => <option key={f.id} value={f.id}>{f.codigo} · {f.nombre}</option>)}</select></label>
                <Submit className="btn-primary" pendiente="Añadiendo…">Añadir cliente</Submit>
                <button type="button" onClick={() => setNuevoAbierto(false)} className="text-sm font-semibold text-muted underline underline-offset-2">Cancelar</button>
              </FormAviso>
            )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro">
          {FILTROS.map(([k, t]) => (
            <button key={k} type="button" aria-pressed={filtro === k} onClick={() => setFiltro(k)}
              className={cx("rounded-full px-4 py-1.5 text-sm font-semibold transition-colors", filtro === k ? "bg-ink text-white" : "bg-panel text-muted shadow-card hover:text-ink")}>
              {t}<span className={cx("num ml-1.5 !font-bold", filtro === k ? "opacity-75" : "text-faint")}>{cuenta(k)}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-panel p-1 shadow-card" role="group" aria-label="Vista">
            {(["lista", "tablero"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={vista === v} onClick={() => setVista(v)}
                className={cx("rounded-full px-4 py-1 text-sm font-semibold", vista === v ? "bg-ink text-white" : "text-muted hover:text-ink")}>{v === "lista" ? "Lista" : "Tablero"}</button>
            ))}
          </div>
          <label className="sr-only" htmlFor="mc-q">Buscar cliente</label>
          <input id="mc-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente" className="input !w-44 !bg-panel" />
          <label className="sr-only" htmlFor="mc-o">Ordenar</label>
          <select id="mc-o" value={orden} onChange={(e) => setOrden(e.target.value as Orden)} className="input !w-auto !bg-panel">{ORDENES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="tarjeta p-8 text-center text-muted">Todavía no hay clientes. Pulsa «+ Nuevo cliente» para añadir el primero.</div>
      ) : visibles.length === 0 ? (
        <div className="tarjeta p-8 text-center text-muted">Ningún cliente coincide con el filtro.</div>
      ) : vista === "lista" ? (
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
          <div className="tarjeta overflow-hidden">
            <div className="flex justify-between border-b border-line px-4 py-2.5"><span className="etiqueta">Cliente</span><span className="etiqueta">Importe</span></div>
            <ul className="max-h-[36rem] divide-y divide-line overflow-y-auto">
              {visibles.map((c) => {
                const activo = actual?.id === c.id;
                const cad = caducados(c);
                return (
                  <li key={c.id}>
                    <button type="button" aria-current={activo ? "true" : undefined} onClick={() => abrir(c.id)}
                      onKeyDown={(e) => {
                        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                        e.preventDefault();
                        const li = e.currentTarget.closest("li");
                        const otro = (e.key === "ArrowDown" ? li?.nextElementSibling : li?.previousElementSibling)?.querySelector("button");
                        (otro as HTMLButtonElement | null)?.focus();
                      }}
                      className={cx("block w-full border-l-4 px-4 py-2.5 text-left transition-colors hover:bg-soft", activo ? "border-l-marca bg-sun-50" : "border-l-transparent")}>
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate font-bold leading-snug">{c.nombre}</span>
                        <span className="num shrink-0">{importe(c) == null ? "—" : eur0(importe(c))}</span>
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">{etiqueta(c)}{tramos(c)}<span>{FASES[c.fase]}</span><span className="num !font-normal">· {hecho(c)}/{lista(c).length}</span></span>
                      <span className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                        {falta(c)}
                        <span className="flex flex-wrap items-center gap-1.5">
                          {cad.length > 0 && <span title={`La fecha de «${cad[0].nombre}» tiene más de ${cad[0].aviso_anios} años`} className="whitespace-nowrap rounded-full bg-sun-50 px-2.5 py-0.5 text-xs font-bold text-sun-700">⚠ Verificar factura</span>}
                          {c.fase === FASE_FINAL && !c.cobrado_at
                            ? <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); cobrar(c.id); }}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); cobrar(c.id); } }}
                                className="btn btn-primary !px-3 !py-0.5 !text-xs">Marcar pagado</span>
                            : cobro(c)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <aside aria-label="Cliente seleccionado"
            className={cx("tarjeta overflow-hidden", panelAbierto ? "fixed inset-0 z-50 overflow-y-auto !rounded-none" : "hidden", "lg:sticky lg:top-20 lg:z-auto lg:block lg:!rounded-[18px] lg:overflow-hidden")}>
            {actual ? panel(actual) : <p className="p-6 text-center text-muted">Elige un cliente de la lista.</p>}
          </aside>
        </div>
      ) : (
        <div className="grid grid-flow-col auto-cols-[minmax(15rem,1fr)] gap-3 overflow-x-auto pb-2 md:grid-flow-row md:grid-cols-3 md:auto-cols-auto xl:grid-cols-6">
          {FASES.map((nombre, i) => {
            const cs = visibles.filter((c) => c.fase === i);
            return (
              <section key={nombre} className="min-h-[14rem] rounded-[18px] bg-soft p-3" aria-label={nombre}>
                <h2 className="mb-2 flex items-center justify-between gap-2 text-sm font-bold">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: FASE_COLOR[i] }} />{nombre}</span>
                  <span className="rounded-full bg-panel px-2.5 text-xs shadow-card">{cs.length}</span>
                </h2>
                <ul className="grid gap-2.5">
                  {cs.map((c) => (
                    <li key={c.id} className="rounded-xl bg-panel p-3 text-sm shadow-card" style={{ borderLeft: `4px solid ${FASE_COLOR[i]}` }}>
                      <p className="font-bold leading-tight">{c.nombre}</p>
                      <p className="mt-1 text-xs text-muted">{c.mwh == null ? <span className="font-semibold text-sun-700">Sin MWh todavía</span> : <><span className="font-mono">{num(c.mwh)} MWh · {num(c.precio_mwh)} €/MWh</span> · <span className="num text-sm text-ink">{eur(importe(c))}</span></>}</p>
                      <p className="mt-2 flex flex-wrap items-center gap-2">{etiqueta(c)}<span className="num text-xs text-muted">{hecho(c)}/{lista(c).length}</span></p>
                      <p className="mt-1">{falta(c)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <FormAviso action={moverFaseDirecto}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="-1" /><button disabled={c.fase === 0} aria-label="Volver a la fase anterior" className="btn btn-ghost !px-3 !py-0.5">←</button></FormAviso>
                        <FormAviso action={moverFaseDirecto}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="1" /><button disabled={c.fase === FASE_FINAL} aria-label="Pasar a la fase siguiente" className="btn btn-ghost !px-3 !py-0.5">→</button></FormAviso>
                        {c.cobrado_at ? cobro(c) : c.fase === FASE_FINAL && <FormAviso action={cambiarCobroDirecto}><input type="hidden" name="id" value={c.id} /><button className="btn btn-primary !px-3 !py-0.5">Marcar pagado</button></FormAviso>}
                        <button type="button" onClick={() => { abrir(c.id); setVista("lista"); }} className="ml-auto text-xs font-semibold text-net-700 underline underline-offset-2">Detalle</button>
                      </div>
                    </li>
                  ))}
                  {cs.length === 0 && <li className="px-1 py-2 text-xs text-muted">Nada en esta fase.</li>}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
