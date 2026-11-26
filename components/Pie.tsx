import Link from "next/link";
import { ENLACES_LEGALES } from "@/lib/legal";

/** Pie con los datos de contacto de INER (los mismos que figuran en iner.es) y los enlaces legales. */
export function Pie() {
  return (
    <footer className="mt-12 border-t border-line bg-panel">
      <div className="contenedor flex flex-wrap justify-between gap-x-10 gap-y-6 py-8 text-sm">
        <p className="max-w-xs text-muted">Soluciones energéticas para empresas e industria que ayudan a reducir costes y mejorar la eficiencia.</p>
        <address className="space-y-1 not-italic text-muted">
          <p className="font-bold text-ink">Contacto</p>
          <p>Parque Científico y Tecnológico de Albacete<br />Paseo de la Innovación, 3 · Edificio 4, Módulo 8 · 02006 Albacete</p>
          <p><a href="tel:+34900848402" className="font-semibold text-ink underline-offset-2 hover:underline">+34 900 84 84 02</a> · <a href="mailto:info@iner.es" className="font-semibold text-ink underline-offset-2 hover:underline">info@iner.es</a></p>
        </address>
      </div>
      <nav aria-label="Información legal" className="border-t border-line">
        <ul className="contenedor flex flex-wrap gap-x-6 gap-y-1 py-3 text-sm text-muted">
          {ENLACES_LEGALES.map((e) => (
            <li key={e.href}><Link href={e.href} className="inline-block py-1 underline-offset-2 hover:text-ink hover:underline">{e.texto}</Link></li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
