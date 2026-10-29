import Link from "next/link";
import { recuperar } from "@/app/actions";
import { FormEstado } from "@/components/FormEstado";
import { Submit } from "@/components/Submit";
import { Marca } from "@/components/Marca";

export default async function Recuperar({ searchParams }: { searchParams: Promise<{ caducado?: string }> }) {
  const { caducado } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <FormEstado action={recuperar} className="w-full max-w-sm space-y-4 tarjeta p-8">
        <Marca className="h-10" />
        <h1 className="text-2xl font-bold tracking-[-0.02em]">Crear una contraseña nueva</h1>
        {caducado && <p role="alert" className="rounded-xl bg-sun-50 p-3 text-sm text-sun-700">El enlace ha caducado o ya se usó. Pide uno nuevo con tu correo.</p>}
        <div>
          <label className="label" htmlFor="email">Correo</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <Submit className="btn-primary w-full !py-3" pendiente="Enviando…">Enviar enlace</Submit>
        <p className="text-sm"><Link href="/login" className="font-semibold text-net-700 underline underline-offset-2">Volver a entrar</Link></p>
      </FormEstado>
    </main>
  );
}
