"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cerrarSesion } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { Marca } from "@/components/Marca";
import { cx } from "@/lib/utils";

type Enlace = { href: string; texto: string; badge?: number };

export function Cabecera({ nombre, rol, enlaces }: { nombre: string; rol?: string; enlaces: Enlace[] }) {
  const ruta = usePathname();
  // El enlace raíz solo está activo en su ruta exacta; los demás, también en sus subrutas.
  const activo = (href: string) => (enlaces.some((e) => e.href !== href && e.href.startsWith(href + "/")) ? ruta === href : ruta === href || ruta.startsWith(href + "/"));
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <Link href={enlaces[0].href} aria-label="Inicio" className="shrink-0"><Marca className="h-9" /></Link>
        <nav aria-label="Principal" className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} aria-current={activo(e.href) ? "page" : undefined}
              className={cx("relative whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors", activo(e.href) ? "bg-ink text-white" : "text-muted hover:bg-soft hover:text-ink")}>
              {e.texto}
              {!!e.badge && <span className="latido ml-2 rounded-full bg-sun px-1.5 py-0.5 text-[11px] font-black text-white">{e.badge}</span>}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="max-w-[14rem] truncate text-sm font-bold">{nombre}</p>
            {rol && <p className="text-xs text-muted">{rol}</p>}
          </div>
          <Avatar nombre={nombre} tamano="sm" />
          <form action={cerrarSesion}><button className="btn btn-ghost !px-3 !py-1.5">Salir</button></form>
        </div>
      </div>
    </header>
  );
}
