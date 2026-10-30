import { iniciarSesion } from "@/app/actions";
import { FormEstado } from "@/components/FormEstado";
import { Submit } from "@/components/Submit";
import { EscenaSolar } from "@/components/Ilustraciones";
import { Marca } from "@/components/Marca";

export function LoginForm({ equipo = false }: { equipo?: boolean }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden bg-brand p-8 text-white lg:p-14">
        <Marca claro className="h-12 self-start" />
        <div className="my-10 max-w-lg">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            {equipo ? "Panel del equipo INER" : "Tus clientes y tus comisiones, en un solo sitio"}
          </h1>
          <p className="mt-5 text-lg font-light leading-relaxed text-white/95">
            {equipo ? "Gestiona colaboradores, fases de los CAE y pagos." : "Mira en qué fase está cada cliente que nos has pasado y cuánto te corresponde cobrar."}
          </p>
        </div>
        <div className="relative z-10 flex items-end justify-between gap-6">
          <p className="text-sm text-white/90">Acceso solo con cuenta creada por INER.</p>
          <span className="hidden text-white/80 sm:block"><EscenaSolar className="w-72 xl:w-80" /></span>
        </div>
        <span aria-hidden className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-white/10" />
        <span aria-hidden className="pointer-events-none absolute -top-24 right-20 h-56 w-56 rounded-full bg-white/10" />
      </section>
      <section className="flex items-center justify-center p-6">
        <FormEstado action={iniciarSesion} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-3xl font-bold tracking-[-0.02em]">{equipo ? "Acceso del equipo" : "Entrar"}</h2>
            <p className="mt-1 text-sm text-muted">{equipo ? "Delegados y administradores." : "Con el correo y la contraseña que te dio INER."}</p>
          </div>
          <div>
            <label className="label" htmlFor="email">Correo</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
          </div>
          <Submit className="btn-primary w-full !py-3" pendiente="Entrando…">Entrar</Submit>
          <p className="text-sm text-muted">¿No recuerdas tu contraseña? Pídesela a tu contacto en INER.</p>
        </FormEstado>
      </section>
    </main>
  );
}
