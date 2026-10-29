import Link from "next/link";
import { cerrarSesion } from "@/app/actions";
import { Marca } from "@/components/Marca";

const iniciales = (n: string) => n.split(/[\s@·.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function Cabecera({ nombre, enlaces }: { nombre: string; enlaces: { href: string; texto: string; badge?: number }[] }) {
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={enlaces[0].href}><Marca claro /></Link>
        <nav className="flex items-center gap-1 text-sm">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} className="rounded-lg px-3 py-1.5 font-medium text-white/85 hover:bg-white/10 hover:text-white">
              {e.texto}
              {!!e.badge && <span className="ml-1.5 rounded-full bg-ambar px-1.5 py-0.5 text-[11px] font-bold text-navy">{e.badge}</span>}
            </Link>
          ))}
          <span className="mx-2 hidden text-white/60 sm:inline">{nombre}</span>
          <span aria-hidden className="mx-1 grid h-8 w-8 place-items-center rounded-full bg-ambar text-xs font-bold text-navy">{iniciales(nombre)}</span>
          <form action={cerrarSesion}><button className="rounded-lg px-3 py-1.5 font-medium text-white/85 hover:bg-white/10">Salir</button></form>
        </nav>
      </div>
    </header>
  );
}
