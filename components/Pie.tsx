/** Pie con los datos de contacto de INER (los mismos que figuran en iner.es). */
export function Pie() {
  return (
    <footer className="mt-12 border-t border-line bg-panel">
      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-x-10 gap-y-6 px-4 py-8 text-sm">
        <p className="max-w-xs text-muted">Soluciones energéticas para empresas e industria que ayudan a reducir costes y mejorar la eficiencia.</p>
        <address className="space-y-1 not-italic text-muted">
          <p className="font-bold text-ink">Contacto</p>
          <p>Parque Científico y Tecnológico de Albacete<br />Pase de la Innovación, 3 · Edificio 4, Módulo 6 · 02006</p>
          <p><a href="tel:+34900848402" className="font-semibold text-ink underline-offset-2 hover:underline">+34 900 84 84 02</a> · <a href="mailto:info@iner.es" className="font-semibold text-ink underline-offset-2 hover:underline">info@iner.es</a></p>
        </address>
      </div>
    </footer>
  );
}
