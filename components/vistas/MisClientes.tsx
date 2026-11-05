"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cambiarCobroDirecto, crearClienteDirecto, eliminarClienteDirecto, guardarClienteDirecto, guardarFechaDocumento, marcarDocumento, moverFaseDirecto } from "@/app/actions";
import { BotonBorrar } from "@/components/BotonBorrar";
import { Fase, Kpi, Recorrido } from "@/components/Fase";
import { FormAviso } from "@/components/FormAviso";
import { Submit } from "@/components/Submit";
import { avisar } from "@/lib/avisar";
import type { ClienteDirecto, FichaDoc, FichaTipo, MarcaDoc } from "@/lib/types";
import { FASES, FASE_COLOR, cx, eur, eur0, fecha, num } from "@/lib/utils";

const FILTROS = [["todos", "Todos"], ["tram", "En tramitación"], ["pend", "Por cobrar"], ["ok", "Cobrados"], ["docs", "Faltan documentos"]] as const;
const ORDENES = [["rec", "Más recientes"], ["nom", "Nombre (A-Z)"], ["fase", "Fase (más avanzada)"], ["imp", "Importe (mayor)"], ["docs", "Documentos que faltan"]] as const;
const COLUMNAS = "md:grid-cols-[minmax(0,2.4fr)_6rem_minmax(0,1.7fr)_4.5rem_6.5rem_8rem_8.5rem] md:gap-x-4";
const clave = (c: string, d: string) => `${c}:${d}`;
const mapa = (ms: MarcaDoc[]) => new Map(ms.map((m) => [clave(m.cliente_id, m.documento_id), m]));
const importe = (c: ClienteDirecto) => (c.mwh == null ? null : c.mwh * c.precio_mwh);
const estado = (c: ClienteDirecto) => (c.cobrado_at ? "ok" : c.fase === 4 ? "pend" : "tram");
const viejo = (iso: string | null | undefined, anios: number) => { if (!iso) return false; const l = new Date(); l.setFullYear(l.getFullYear() - anios); return new Date(iso) < l; };

export function MisClientes({ fichas, docs, clientes, marcas, esAdmin }: { fichas: FichaTipo[]; docs: FichaDoc[]; clientes: ClienteDirecto[]; marcas: MarcaDoc[]; esAdmin: boolean }) {
  const [m, setM] = useState(() => mapa(marcas));
  useEffect(() => setM(mapa(marcas)), [marcas]);
  const [vista, setVista] = useState<"lista" | "tablero">("lista");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number][0]>("todos");
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState<(typeof ORDENES)[number][0]>("rec");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [claveNuevo, setClaveNuevo] = useState(0);
  const [editando, setEditando] = useState<string | null>(null);
  const [fichaSel, setFichaSel] = useState<Record<string, string>>({});

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

  const suma = (cs: ClienteDirecto[]) => cs.reduce((a, c) => a + (importe(c) ?? 0), 0);
  const cobrados = clientes.filter((c) => estado(c) === "ok");
  const porCobrar = clientes.filter((c) => estado(c) === "pend");
  const enTramite = clientes.filter((c) => estado(c) === "tram");

  const visibles = clientes
    .filter((c) => (filtro === "todos" || (filtro === "docs" ? faltan(c) > 0 : estado(c) === filtro)) && c.nombre.toLowerCase().includes(q.trim().toLowerCase()))
    .sort({
      rec: (a: ClienteDirecto, b: ClienteDirecto) => b.created_at.localeCompare(a.created_at),
      nom: (a: ClienteDirecto, b: ClienteDirecto) => a.nombre.localeCompare(b.nombre, "es"),
      fase: (a: ClienteDirecto, b: ClienteDirecto) => b.fase - a.fase,
      imp: (a: ClienteDirecto, b: ClienteDirecto) => (importe(b) ?? -1) - (importe(a) ?? -1),
      docs: (a: ClienteDirecto, b: ClienteDirecto) => faltan(b) - faltan(a),
    }[orden]);

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

  const progreso = (c: ClienteDirecto) => {
    const h = hecho(c), t = lista(c).length, ok = t > 0 && h === t;
    return (
      <span className={cx("inline-flex items-center gap-2 text-xs", ok ? "font-semibold text-batt-700" : "text-muted")}>
        <span className="h-1.5 w-14 overflow-hidden rounded-full bg-line" aria-hidden><span className={cx("block h-full rounded-full", ok ? "bg-batt" : "bg-marca")} style={{ width: `${t ? Math.round((h / t) * 100) : 0}%` }} /></span>
        <span className="num !font-semibold">{h}/{t}</span>{ok && "listos"}
      </span>
    );
  };
  const cobro = (c: ClienteDirecto) => {
    const e = estado(c);
    return e === "ok" ? <span className="whitespace-nowrap rounded-full bg-batt-50 px-2.5 py-0.5 text-xs font-bold text-batt-700">Cobrado {fecha(c.cobrado_at)}</span>
      : e === "pend" ? <span className="whitespace-nowrap rounded-full bg-sun-50 px-2.5 py-0.5 text-xs font-bold text-sun-700">Por cobrar</span>
      : <span className="whitespace-nowrap rounded-full bg-net-50 px-2.5 py-0.5 text-xs font-bold text-net-700">En tramitación</span>;
  };
  const etiqueta = (c: ClienteDirecto) => <span className="rounded-md bg-net-50 px-2 py-0.5 text-xs font-bold tracking-wide text-net-700">{ficha.get(c.ficha_id)?.codigo ?? "—"}</span>;

  function detalle(c: ClienteDirecto) {
    const abierta = editando === c.id;
    const sel = fichaSel[c.id] ?? c.ficha_id;
    const ds = lista(c);
    const grupos = ds.reduce<{ grupo: string; items: FichaDoc[] }[]>((a, d) => { const g = a.find((x) => x.grupo === d.grupo); if (g) g.items.push(d); else a.push({ grupo: d.grupo, items: [d] }); return a; }, []);
    const f = ficha.get(c.ficha_id);
    return (
      <div className="border-t border-line bg-soft px-4 py-4 md:px-6">
        <h3 className="etiqueta mb-3">Documentos de la ficha {f?.codigo} · {hecho(c)} de {ds.length} listos</h3>
        {ds.length === 0
          ? <p className="text-sm text-muted">Esta ficha todavía no tiene documentos.{esAdmin && <> <Link href="/equipo/mis-clientes/fichas" className="font-semibold text-net-700 underline underline-offset-2">Añádelos aquí</Link>.</>}</p>
          : (
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              {grupos.map((g) => (
                <div key={g.grupo}>
                  <h4 className="etiqueta mb-1 !text-faint">{g.grupo}</h4>
                  {g.items.map((d) => {
                    const dep = d.depende_de ? ds.find((x) => x.id === d.depende_de) : null;
                    const bloq = !!dep && !listo(c, dep);
                    const id = `doc-${c.id}-${d.id}`;
                    const fch = m.get(clave(c.id, d.id))?.fecha ?? "";
                    return (
                      <div key={d.id} className="py-1.5">
                        <label htmlFor={id} className={cx("grid grid-cols-[auto_1fr] gap-x-2.5", bloq ? "cursor-not-allowed opacity-55" : "cursor-pointer")}>
                          <input id={id} type="checkbox" checked={listo(c, d)} disabled={bloq} onChange={(e) => alternar(c, d, e.target.checked)} className="mt-0.5 h-[18px] w-[18px] accent-batt" />
                          <span className="text-sm font-semibold">{d.nombre}</span>
                          {(d.ayuda || bloq) && <span className="col-start-2 text-xs text-muted">{d.ayuda}{bloq && ` Se desbloquea al marcar «${dep?.nombre}».`}</span>}
                        </label>
                        {d.aviso_anios && (
                          <div className="ml-7 mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                            <label htmlFor={`${id}-f`}>Fecha</label>
                            <input id={`${id}-f`} type="date" value={fch} onChange={(e) => ponerFecha(c, d, e.target.value)} className="rounded-full border border-line bg-panel px-3 py-1 text-sm text-ink" />
                            {viejo(fch, d.aviso_anios) && <span className="rounded-full bg-sun-50 px-2.5 py-0.5 font-semibold text-sun-700">Verificar: más de {d.aviso_anios} {d.aviso_anios === 1 ? "año" : "años"}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <FormAviso action={moverFaseDirecto}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="-1" /><button disabled={c.fase === 0} className="btn btn-ghost !px-4 !py-1.5">← Fase anterior</button></FormAviso>
          <FormAviso action={moverFaseDirecto}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="1" /><button disabled={c.fase === 4} className="btn btn-ghost !px-4 !py-1.5">Fase siguiente →</button></FormAviso>
          {c.fase === 4 && !c.cobrado_at && <FormAviso action={cambiarCobroDirecto}><input type="hidden" name="id" value={c.id} /><button className="btn btn-primary !px-4 !py-1.5">Marcar cobrado</button></FormAviso>}
          {c.cobrado_at && <FormAviso action={cambiarCobroDirecto}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="accion" value="quitar" /><button className="text-xs font-semibold text-net-700 underline underline-offset-2">Quitar el cobro</button></FormAviso>}
          <button type="button" onClick={() => setEditando(abierta ? null : c.id)} aria-expanded={abierta} className="ml-auto text-xs font-semibold text-net-700 underline underline-offset-2">{abierta ? "Cerrar" : "Editar datos"}</button>
        </div>

        {abierta && (
          <FormAviso action={guardarClienteDirecto} alTerminar={(bien) => bien && setEditando(null)} className="mt-3 grid gap-3 rounded-xl bg-panel p-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={c.id} />
            <label className="text-xs text-muted sm:col-span-2" htmlFor={`n-${c.id}`}>Nombre del cliente<input id={`n-${c.id}`} name="nombre" required maxLength={200} defaultValue={c.nombre} className="input mt-1 !py-1.5" /></label>
            <label className="text-xs text-muted sm:col-span-2" htmlFor={`f-${c.id}`}>Tipo de ficha
              <select id={`f-${c.id}`} name="ficha_id" value={sel} onChange={(e) => setFichaSel({ ...fichaSel, [c.id]: e.target.value })} className="input mt-1 !py-1.5">
                {fichas.map((x) => <option key={x.id} value={x.id}>{x.codigo} · {x.nombre}</option>)}
              </select>
              {sel !== c.ficha_id && <span className="mt-1 block font-semibold text-sun-700">Con otra ficha los documentos son otros: se pierden los que tenías marcados.</span>}
            </label>
            <label className="text-xs text-muted" htmlFor={`m-${c.id}`}>MWh<input id={`m-${c.id}`} name="mwh" inputMode="decimal" defaultValue={c.mwh ?? ""} className="input mt-1 !py-1.5 font-mono" /></label>
            <label className="text-xs text-muted" htmlFor={`p-${c.id}`}>€ por MWh<input id={`p-${c.id}`} name="precio_mwh" inputMode="decimal" required defaultValue={c.precio_mwh} className="input mt-1 !py-1.5 font-mono" /></label>
            <Submit className="btn-primary !py-1.5 sm:col-span-2" pendiente="Guardando…">Guardar</Submit>
          </FormAviso>
        )}

        <div className="mt-3">
          <BotonBorrar action={eliminarClienteDirecto} campos={{ id: c.id }} boton="Eliminar cliente…"
            aviso={`Se borran el cliente y sus documentos marcados${c.cobrado_at ? ", y se pierde un cobro ya registrado" : ""}. No se puede deshacer.`} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow !mb-0">Equipo INER</p>
          <h1 className="text-3xl font-bold tracking-[-0.02em]">Mis clientes</h1>
          <p className="text-muted">Los clientes que llevas directamente, sin colaborador: ficha, documentos y cobro.</p>
        </div>
        {esAdmin && <Link href="/equipo/mis-clientes/fichas" className="btn btn-ghost">Gestionar fichas</Link>}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_1.15fr]">
        <Kpi tono="marca" compacto etiqueta="Cobrado hasta hoy" valor={eur(suma(cobrados))} nota={`${cobrados.length} cliente${cobrados.length === 1 ? "" : "s"} cobrado${cobrados.length === 1 ? "" : "s"}`} />
        <Kpi tono="sun" etiqueta="Pendiente de cobrar" valor={eur(suma(porCobrar))} nota={`${porCobrar.length} con CAE expedido, sin cobrar`} />
        <Kpi tono="net" etiqueta="En tramitación" valor={eur(suma(enTramite))} nota={`${enTramite.length} cliente${enTramite.length === 1 ? "" : "s"} sin CAE expedido`} />
        <div className="tarjeta flex flex-col gap-2 p-5">
          <h2 className="font-bold">Nuevo cliente</h2>
          {fichas.length === 0
            ? <p className="text-sm text-muted">Primero hace falta una ficha.{esAdmin ? <> <Link href="/equipo/mis-clientes/fichas" className="font-semibold text-net-700 underline underline-offset-2">Créala aquí</Link>.</> : " Pídele a un administrador que la cree."}</p>
            : (
              <FormAviso key={claveNuevo} action={crearClienteDirecto} alTerminar={(bien) => bien && setClaveNuevo((k) => k + 1)} className="flex flex-col gap-2">
                <p className="text-xs text-muted">Empieza en «Cálculo de CAEs».</p>
                <label className="sr-only" htmlFor="nc-nombre">Nombre del nuevo cliente</label>
                <input id="nc-nombre" name="nombre" required maxLength={200} placeholder="Nombre o razón social" className="input !bg-soft" />
                <label className="sr-only" htmlFor="nc-ficha">Tipo de ficha</label>
                <select id="nc-ficha" name="ficha_id" className="input !bg-soft">{fichas.map((f) => <option key={f.id} value={f.id}>{f.codigo} · {f.nombre}</option>)}</select>
                <Submit className="btn-primary" pendiente="Añadiendo…">Añadir cliente</Submit>
              </FormAviso>
            )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro">
          {FILTROS.map(([k, t]) => (
            <button key={k} type="button" aria-pressed={filtro === k} onClick={() => setFiltro(k)}
              className={cx("rounded-full px-4 py-1.5 text-sm font-semibold transition-colors", filtro === k ? "bg-ink text-white" : "bg-panel text-muted shadow-card hover:text-ink")}>{t}</button>
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
          <select id="mc-o" value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} className="input !w-auto !bg-panel">{ORDENES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="tarjeta p-8 text-center text-muted">Todavía no hay clientes. Añade el primero arriba.</div>
      ) : visibles.length === 0 ? (
        <div className="tarjeta p-8 text-center text-muted">Ningún cliente coincide con el filtro.</div>
      ) : vista === "lista" ? (
        <div className="tarjeta overflow-hidden">
          <div className={cx("hidden gap-x-3 border-b border-line px-4 py-2.5 md:grid", COLUMNAS)}>
            {["Cliente", "Ficha", "Fase", "MWh", "Importe", "Documentos", "Cobro"].map((t, i) => <span key={t} className={cx("etiqueta", (i === 3 || i === 4) && "text-right")}>{t}</span>)}
          </div>
          <ul className="divide-y divide-line">
            {visibles.map((c) => (
              <li key={c.id}>
                <button type="button" aria-expanded={abierto === c.id} onClick={() => setAbierto(abierto === c.id ? null : c.id)} className="block w-full px-4 py-3 text-left transition-colors hover:bg-soft">
                  <span className="md:hidden">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0"><span className="block font-bold leading-tight">{c.nombre}</span><span className="block text-xs text-muted">Alta {fecha(c.created_at)} · {num(c.precio_mwh)} €/MWh</span></span>
                      <span className="num shrink-0 text-lg">{eur0(importe(c))}</span>
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">{etiqueta(c)}<Fase fase={c.fase} />{progreso(c)}{cobro(c)}</span>
                  </span>
                  <span className={cx("hidden items-center gap-x-3 md:grid", COLUMNAS)}>
                    <span className="min-w-0"><span className="block truncate font-bold">{c.nombre}</span><span className="block text-xs text-muted">Alta {fecha(c.created_at)} · {num(c.precio_mwh)} €/MWh</span></span>
                    <span>{etiqueta(c)}</span>
                    <span><Recorrido fase={c.fase} /></span>
                    <span className="num text-right text-sm !font-semibold">{num(c.mwh)}</span>
                    <span className="num text-right">{eur(importe(c))}</span>
                    <span>{progreso(c)}</span>
                    <span>{cobro(c)}</span>
                  </span>
                </button>
                {abierto === c.id && detalle(c)}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="grid grid-flow-col auto-cols-[minmax(15rem,1fr)] gap-3 overflow-x-auto pb-2 md:grid-flow-row md:grid-cols-5 md:auto-cols-auto">
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
                      <p className="mt-2 flex flex-wrap items-center gap-2">{etiqueta(c)}{progreso(c)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <FormAviso action={moverFaseDirecto}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="-1" /><button disabled={c.fase === 0} aria-label="Volver a la fase anterior" className="btn btn-ghost !px-3 !py-0.5">←</button></FormAviso>
                        <FormAviso action={moverFaseDirecto}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="delta" value="1" /><button disabled={c.fase === 4} aria-label="Pasar a la fase siguiente" className="btn btn-ghost !px-3 !py-0.5">→</button></FormAviso>
                        {c.cobrado_at ? cobro(c) : c.fase === 4 && <FormAviso action={cambiarCobroDirecto}><input type="hidden" name="id" value={c.id} /><button className="btn btn-primary !px-3 !py-0.5">Marcar cobrado</button></FormAviso>}
                        <button type="button" onClick={() => { setAbierto(c.id); setVista("lista"); }} className="ml-auto text-xs font-semibold text-net-700 underline underline-offset-2">Detalle</button>
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
