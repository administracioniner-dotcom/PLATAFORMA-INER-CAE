import Link from "next/link";
import { iniciarSesion } from "@/app/actions";
import { FormEstado } from "@/components/FormEstado";
import { Submit } from "@/components/Submit";
import { Marca } from "@/components/Marca";

export function LoginForm({ equipo = false }: { equipo?: boolean }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col justify-between bg-navy p-8 text-white lg:p-14">
        <Marca claro />
        <div className="my-16 max-w-md">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{equipo ? "Panel del equipo INER" : "Tus clientes y tus comisiones, en un solo sitio"}</h1>
          <p className="mt-4 text-white/75">{equipo ? "Gestiona colaboradores, fases de los CAE y pagos." : "Consulta en qué fase está cada cliente que nos has pasado y cuánto te corresponde cobrar."}</p>
        </div>
        <p className="text-sm text-white/50">Acceso solo por invitación.</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <FormEstado action={iniciarSesion} className="w-full max-w-sm space-y-4">
          <h2 className="text-2xl font-bold">{equipo ? "Acceso del equipo" : "Entrar"}</h2>
          <div>
            <label className="label" htmlFor="email">Correo</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
          </div>
          <Submit className="btn-primary w-full" pendiente="Entrando…">Entrar</Submit>
          <p className="text-sm"><Link href="/recuperar" className="font-medium text-verde underline underline-offset-2">He olvidado mi contraseña</Link></p>
        </FormEstado>
      </section>
    </main>
  );
}
