import { iniciarSesion } from "@/app/actions";
import { FormEstado } from "@/components/FormEstado";
import { Submit } from "@/components/Submit";
import { Marca } from "@/components/Marca";

export function LoginForm({ equipo = false }: { equipo?: boolean }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative flex min-h-[24rem] flex-col justify-between overflow-hidden bg-ink p-8 text-white lg:p-14">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/iner-hero.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[78%_center]" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/25" />
        <Marca claro className="relative h-12 self-start" />
        <div className="relative max-w-lg">
          <p className="eyebrow !text-marca">{equipo ? "Equipo INER" : "Portal de colaboradores"}</p>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            {equipo ? <>Panel del <span className="resalte resalte-solido">equipo</span> INER</> : <>Tus clientes y tus <span className="resalte resalte-solido">comisiones</span>, en un solo sitio</>}
          </h1>
          <p className="mt-5 text-lg font-light leading-relaxed text-white/90">
            {equipo ? "Gestiona colaboradores, fases de los CAE y pagos." : "Mira en qué fase está cada cliente que nos has pasado y cuánto te corresponde cobrar."}
          </p>
        </div>
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
          <Submit className="btn-primary flecha w-full !py-3" pendiente="Entrando…">Entrar</Submit>
          <p className="text-sm text-muted">¿No recuerdas tu contraseña? Pídesela a tu contacto en INER.</p>
        </FormEstado>
      </section>
    </main>
  );
}
