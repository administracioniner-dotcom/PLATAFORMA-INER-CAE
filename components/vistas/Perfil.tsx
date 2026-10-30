import { cambiarMiContrasena, guardarNombre } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { FormEstado } from "@/components/FormEstado";
import { Kpi } from "@/components/Fase";
import { Submit } from "@/components/Submit";
import { fecha } from "@/lib/utils";

export function Perfil({ nombre, email, rol, desde, datos }: {
  nombre: string | null; email: string; rol: string; desde: string; datos?: { etiqueta: string; valor: string; tono?: "ink" | "batt" | "net" }[];
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="tarjeta flex flex-wrap items-center gap-5 p-6 sm:p-8">
        <Avatar nombre={nombre ?? email} tamano="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold tracking-[-0.02em]">{nombre ?? email}</h1>
          <p className="text-muted">{email}</p>
          <p className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-brand px-3 py-1 text-ink">{rol}</span>
            <span className="rounded-full bg-soft px-3 py-1 text-muted">Con INER desde {fecha(desde)}</span>
          </p>
        </div>
      </section>

      {datos && (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {datos.map((d) => <Kpi key={d.etiqueta} etiqueta={d.etiqueta} valor={d.valor} tono={d.tono} />)}
        </section>
      )}

      <FormEstado action={guardarNombre} className="tarjeta space-y-4 p-6">
        <h2 className="text-xl font-bold">Tu nombre</h2>
        <p className="text-sm text-muted">Es el que verán en INER y en los mensajes.</p>
        <div className="max-w-md">
          <label className="label" htmlFor="nombre">Nombre o razón social</label>
          <input id="nombre" name="nombre" required maxLength={120} defaultValue={nombre ?? ""} className="input" />
        </div>
        <Submit className="btn-primary" pendiente="Guardando…">Guardar nombre</Submit>
      </FormEstado>

      <FormEstado action={cambiarMiContrasena} className="tarjeta space-y-4 p-6">
        <h2 className="text-xl font-bold">Cambiar contraseña</h2>
        <p className="text-sm text-muted">Escribe la actual y elige una nueva de al menos 10 caracteres.</p>
        <div className="max-w-md space-y-4">
          <div><label className="label" htmlFor="actual">Contraseña actual</label><input id="actual" name="actual" type="password" autoComplete="current-password" required className="input" /></div>
          <div><label className="label" htmlFor="password">Contraseña nueva</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className="input" /></div>
          <div><label className="label" htmlFor="password2">Repite la nueva</label><input id="password2" name="password2" type="password" autoComplete="new-password" minLength={10} required className="input" /></div>
        </div>
        <Submit className="btn-primary" pendiente="Cambiando…">Cambiar contraseña</Submit>
        <p className="text-xs text-muted">Si no recuerdas la actual, pide a INER que te asigne una nueva.</p>
      </FormEstado>
    </div>
  );
}
