import { requireCliente } from "@/lib/auth";

const PREGUNTAS: [string, string][] = [
  ["¿Qué significa cada fase?", "Cálculo de CAEs: calculamos cuántos CAE genera tu actuación. Contrato aceptado: arranca la tramitación. Fase verificador: un organismo revisa tu documentación. Gestor Autonómico: se valida el expediente en tu comunidad autónoma. Fase MITECO: se tramita ante el Ministerio. CAE expedido: ya está listo y te pagamos."],
  ["¿Cuándo se me paga?", "Cuando el CAE está expedido. En «Mi proyecto» ves el importe y si está pendiente o ya pagado."],
  ["¿Cómo entrego los documentos que faltan?", "Envíanoslos por correo a info@iner.es o dínoslo por teléfono. Cuando los recibamos los marcamos y dejan de aparecer como pendientes."],
  ["¿Por qué el importe aparece como «—»?", "Los MWh los introduce INER cuando termina el cálculo. Hasta entonces no se puede calcular el importe."],
  ["He olvidado mi contraseña", "Llámanos o escríbenos y te asignamos una nueva. Cuando entres, puedes cambiarla tú desde «Mi perfil»."],
];

export default async function SoporteCliente() {
  await requireCliente();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="eyebrow !mb-0">Ayuda</p>
        <h1 className="text-3xl font-bold tracking-[-0.02em]">Soporte</h1>
        <p className="text-muted">Respuestas rápidas y cómo hablar con INER.</p>
      </header>
      <section className="tarjeta p-6">
        <p className="eyebrow">Hablar con INER</p>
        <p className="text-xl font-bold">Escríbenos o llámanos</p>
        <p className="mt-1 text-sm text-muted">
          <a href="tel:+34900848402" className="font-semibold text-ink underline-offset-2 hover:underline">+34 900 84 84 02</a> ·{" "}
          <a href="mailto:info@iner.es" className="font-semibold text-ink underline-offset-2 hover:underline">info@iner.es</a>
        </p>
      </section>
      <section className="tarjeta divide-y divide-line">
        {PREGUNTAS.map(([p, r]) => (
          <details key={p} className="group px-5 py-3">
            <summary className="cursor-pointer font-semibold">{p}</summary>
            <p className="mt-2 text-sm text-muted">{r}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
