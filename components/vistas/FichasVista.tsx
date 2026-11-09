import Link from "next/link";
import { anadirDocumento, crearFicha, eliminarDocumento, eliminarFicha, guardarDocumento, guardarFicha, moverDocumento } from "@/app/actions";
import { BotonBorrar } from "@/components/BotonBorrar";
import { FormAviso } from "@/components/FormAviso";
import { FormEstado } from "@/components/FormEstado";
import { Submit } from "@/components/Submit";
import type { FichaDoc, FichaTipo } from "@/lib/types";

export function FichasVista({ fichas, docs, usos }: { fichas: FichaTipo[]; docs: FichaDoc[]; usos: Record<string, number> }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/equipo/mis-clientes" className="text-sm font-semibold text-net-700 underline underline-offset-2">← Volver a Mis clientes</Link>
        <p className="eyebrow !mb-0 mt-3">Administración</p>
        <h1 className="text-3xl font-bold tracking-[-0.02em]">Fichas y documentos</h1>
        <p className="mt-1 max-w-2xl text-muted">Cada ficha (RES060, RES080…) es la lista de documentos que se piden. Escribe aquí los documentos de cada una; en Mis clientes se marcan como listos o no.</p>
      </div>

      <FormEstado action={crearFicha} className="tarjeta grid gap-3 p-5 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <h2 className="font-bold sm:col-span-3">Nueva ficha</h2>
        <div><label className="label" htmlFor="nf-codigo">Código</label><input id="nf-codigo" name="codigo" required maxLength={40} placeholder="RES090" className="input" /></div>
        <div><label className="label" htmlFor="nf-nombre">Nombre</label><input id="nf-nombre" name="nombre" required maxLength={120} placeholder="Qué instalación o actuación es" className="input" /></div>
        <Submit className="btn-primary" pendiente="Creando…">Crear ficha</Submit>
      </FormEstado>

      {fichas.length === 0 && <p className="tarjeta p-6 text-center text-muted">Todavía no hay fichas. Crea la primera arriba.</p>}

      {fichas.map((f) => {
        const mias = docs.filter((d) => d.ficha_id === f.id);
        const grupos = mias.reduce<{ grupo: string; items: FichaDoc[] }[]>((a, d) => { const g = a.find((x) => x.grupo === d.grupo); if (g) g.items.push(d); else a.push({ grupo: d.grupo, items: [d] }); return a; }, []);
        const clientes = usos[f.id] ?? 0;
        return (
          <section key={f.id} className="tarjeta p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold"><span className="mr-2 rounded-md bg-net-50 px-2 py-0.5 text-sm font-bold tracking-wide text-net-700">{f.codigo}</span>{f.nombre}</h2>
                <p className="mt-1 text-sm text-muted">{mias.length} documento{mias.length === 1 ? "" : "s"} · {clientes} cliente{clientes === 1 ? "" : "s"} con esta ficha</p>
              </div>
              <details className="text-sm">
                <summary className="w-fit cursor-pointer text-xs font-semibold text-net-700 underline underline-offset-2">Cambiar nombre o eliminar la ficha</summary>
                <div className="mt-3 grid gap-3 sm:min-w-[24rem]">
                  <FormEstado action={guardarFicha} className="grid gap-2 rounded-xl bg-soft p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
                    <input type="hidden" name="id" value={f.id} />
                    <div><label className="label !text-xs" htmlFor={`fc-${f.id}`}>Código</label><input id={`fc-${f.id}`} name="codigo" required maxLength={40} defaultValue={f.codigo} className="input !bg-panel !py-1.5" /></div>
                    <div><label className="label !text-xs" htmlFor={`fn-${f.id}`}>Nombre</label><input id={`fn-${f.id}`} name="nombre" required maxLength={120} defaultValue={f.nombre} className="input !bg-panel !py-1.5" /></div>
                    <Submit className="btn-primary !px-4 !py-1.5" pendiente="Guardando…">Guardar</Submit>
                  </FormEstado>
                  <BotonBorrar action={eliminarFicha} campos={{ id: f.id }} boton="Eliminar ficha…" confirmar="Sí, eliminar la ficha"
                    aviso={clientes > 0 ? `Hay ${clientes} cliente${clientes === 1 ? "" : "s"} con esta ficha: no se podrá eliminar hasta que los cambies de ficha o los elimines.` : "Se borran la ficha y todos sus documentos. No se puede deshacer."} />
                </div>
              </details>
            </div>

            <div className="mt-5 space-y-5">
              {grupos.length === 0 && <p className="rounded-xl bg-soft p-4 text-sm text-muted">Esta ficha todavía no tiene documentos. Añade el primero abajo.</p>}
              {grupos.map((g) => (
                <div key={g.grupo}>
                  <h3 className="etiqueta mb-1.5 !text-faint">{g.grupo}</h3>
                  <ul className="divide-y divide-line rounded-xl border border-line">
                    {g.items.map((d, i) => {
                      const dep = d.depende_de ? mias.find((x) => x.id === d.depende_de) : null;
                      return (
                        <li key={d.id} className="px-4 py-2.5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{d.nombre}</p>
                              {d.ayuda && <p className="text-xs text-muted">{d.ayuda}</p>}
                              <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
                                {dep && <span className="rounded-full bg-net-50 px-2 py-0.5 font-semibold text-net-700">Depende de «{dep.nombre}»</span>}
                                {d.aviso_anios && <span className="rounded-full bg-sun-50 px-2 py-0.5 font-semibold text-sun-700">Pide fecha · avisa si pasan {d.aviso_anios} {d.aviso_anios === 1 ? "año" : "años"}</span>}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FormAviso action={moverDocumento}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="delta" value="-1" /><button disabled={i === 0} aria-label={`Subir «${d.nombre}»`} className="btn btn-ghost !px-2.5 !py-0.5">↑</button></FormAviso>
                              <FormAviso action={moverDocumento}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="delta" value="1" /><button disabled={i === g.items.length - 1} aria-label={`Bajar «${d.nombre}»`} className="btn btn-ghost !px-2.5 !py-0.5">↓</button></FormAviso>
                            </div>
                          </div>
                          <details className="mt-1.5">
                            <summary className="w-fit cursor-pointer text-xs font-semibold text-net-700 underline underline-offset-2">Editar o quitar</summary>
                            <div className="mt-2 space-y-3 rounded-xl bg-soft p-4">
                              <FormEstado action={guardarDocumento} className="grid gap-3 sm:grid-cols-2">
                                <input type="hidden" name="id" value={d.id} />
                                <div><label className="label !text-xs" htmlFor={`dg-${d.id}`}>Grupo (la carpeta)</label><input id={`dg-${d.id}`} name="grupo" required maxLength={120} defaultValue={d.grupo} list={`grupos-${f.id}`} className="input !bg-panel !py-1.5" /></div>
                                <div><label className="label !text-xs" htmlFor={`dn-${d.id}`}>Documento</label><input id={`dn-${d.id}`} name="nombre" required maxLength={200} defaultValue={d.nombre} className="input !bg-panel !py-1.5" /></div>
                                <div className="sm:col-span-2"><label className="label !text-xs" htmlFor={`da-${d.id}`}>Ayuda <span className="font-normal text-muted">(opcional)</span></label><input id={`da-${d.id}`} name="ayuda" maxLength={400} defaultValue={d.ayuda ?? ""} className="input !bg-panel !py-1.5" /></div>
                                <div><label className="label !text-xs" htmlFor={`dd-${d.id}`}>Depende de</label>
                                  <select id={`dd-${d.id}`} name="depende_de" defaultValue={d.depende_de ?? ""} className="input !bg-panel !py-1.5">
                                    <option value="">Ninguno</option>
                                    {mias.filter((x) => x.id !== d.id).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                                  </select></div>
                                <div><label className="label !text-xs" htmlFor={`dy-${d.id}`}>Pide fecha y avisa a los (años) <span className="font-normal text-muted">(vacío: no)</span></label><input id={`dy-${d.id}`} name="aviso_anios" inputMode="numeric" defaultValue={d.aviso_anios ?? ""} className="input !bg-panel !py-1.5" /></div>
                                <div><label className="label !text-xs" htmlFor={`dp-${d.id}`}>Lo aporta</label>
                                  <select id={`dp-${d.id}`} name="aporta" defaultValue={d.aporta} className="input !bg-panel !py-1.5">
                                    <option value="cliente">El cliente</option>
                                    <option value="iner">INER</option>
                                  </select></div>
                                <Submit className="btn-primary !py-1.5 sm:col-span-2" pendiente="Guardando…">Guardar documento</Submit>
                              </FormEstado>
                              <BotonBorrar action={eliminarDocumento} campos={{ id: d.id }} boton="Quitar documento…" confirmar="Sí, quitar"
                                aviso="Se quita de la ficha y se pierde la marca de «listo» en los clientes que lo tuvieran. No se puede deshacer." />
                            </div>
                          </details>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <datalist id={`grupos-${f.id}`}>{grupos.map((g) => <option key={g.grupo} value={g.grupo} />)}</datalist>
            <FormEstado action={anadirDocumento} className="mt-5 grid gap-3 rounded-xl bg-soft p-4 sm:grid-cols-2">
              <input type="hidden" name="ficha_id" value={f.id} />
              <h3 className="font-bold sm:col-span-2">Añadir un documento a {f.codigo}</h3>
              <div><label className="label !text-xs" htmlFor={`ag-${f.id}`}>Grupo (la carpeta)</label><input id={`ag-${f.id}`} name="grupo" required maxLength={120} list={`grupos-${f.id}`} placeholder="Elige uno o escribe uno nuevo" className="input !bg-panel !py-1.5" /></div>
              <div><label className="label !text-xs" htmlFor={`an-${f.id}`}>Documento</label><input id={`an-${f.id}`} name="nombre" required maxLength={200} placeholder="Qué hay que tener" className="input !bg-panel !py-1.5" /></div>
              <div className="sm:col-span-2"><label className="label !text-xs" htmlFor={`aa-${f.id}`}>Ayuda <span className="font-normal text-muted">(opcional)</span></label><input id={`aa-${f.id}`} name="ayuda" maxLength={400} placeholder="Una pista que verás junto al documento" className="input !bg-panel !py-1.5" /></div>
              <div><label className="label !text-xs" htmlFor={`ad-${f.id}`}>Depende de</label>
                <select id={`ad-${f.id}`} name="depende_de" defaultValue="" className="input !bg-panel !py-1.5">
                  <option value="">Ninguno</option>
                  {mias.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                </select></div>
              <div><label className="label !text-xs" htmlFor={`ay-${f.id}`}>Pide fecha y avisa a los (años) <span className="font-normal text-muted">(vacío: no)</span></label><input id={`ay-${f.id}`} name="aviso_anios" inputMode="numeric" placeholder="Por ejemplo, 3" className="input !bg-panel !py-1.5" /></div>
              <div><label className="label !text-xs" htmlFor={`ap-${f.id}`}>Lo aporta</label>
                <select id={`ap-${f.id}`} name="aporta" defaultValue="cliente" className="input !bg-panel !py-1.5">
                  <option value="cliente">El cliente</option>
                  <option value="iner">INER</option>
                </select></div>
              <Submit className="btn-primary !py-1.5 sm:col-span-2" pendiente="Añadiendo…">Añadir documento</Submit>
            </FormEstado>
          </section>
        );
      })}
    </div>
  );
}
