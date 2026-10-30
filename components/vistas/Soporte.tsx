import Link from "next/link";
import { FASES, FASE_COLOR } from "@/lib/utils";

const DETALLE = [
  "INER calcula cuántos CAE puede generar el cliente a partir de su actuación.",
  "El cliente acepta el contrato y arranca la tramitación.",
  "Un verificador revisa la documentación de la actuación.",
  "El expediente se tramita ante el MITECO.",
  "El CAE está expedido: ya puedes solicitar el pago de tu comisión.",
];

const PREGUNTAS: [string, string][] = [
  ["¿Cómo se calcula mi comisión?", "Es un porcentaje sobre el valor de los CAE de cada cliente. El porcentaje puede variar de un cliente a otro y lo ves en la columna «Tu %» de tu panel."],
  ["¿Cuándo puedo solicitar el pago?", "Cuando el cliente está en «CAE expedido». Entonces aparece el botón «Solicitar pago» en su fila. INER lo revisa y lo marca como pagado."],
  ["¿Por qué un cliente no tiene MWh o comisión todavía?", "Los MWh los introduce INER cuando termina el cálculo. Hasta entonces la comisión aparece como «—»."],
  ["¿Dónde veo los clientes ya pagados?", "Los clientes pagados se archivan solos a los 7 días. Los encuentras en «Ver archivados», en tu panel."],
  ["¿Puedo añadir yo un cliente?", "No. INER da de alta a los clientes que nos pasas. Escríbenos desde Mensajes con sus datos y los añadimos."],
  ["He olvidado mi contraseña", "Pide a INER que te asigne una nueva. Cuando entres, puedes cambiarla tú desde «Mi perfil»."],
];

export function SoporteVista() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-3xl font-bold tracking-[-0.02em]">Soporte</h1>
        <p className="text-muted">Respuestas rápidas y cómo hablar con INER.</p>
      </header>

      <section className="tarjeta flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-bold">¿Prefieres escribirnos?</p>
          <p className="text-sm text-muted">Tu delegado comercial te responde por Mensajes.</p>
        </div>
        <Link href="/mensajes" className="btn btn-primary">Escribir a INER</Link>
      </section>

      <section className="tarjeta p-5 sm:p-6">
        <h2 className="mb-4 text-xl font-bold">Las cinco fases de un cliente</h2>
        <ol className="space-y-3">
          {FASES.map((f, i) => (
            <li key={f} className="flex gap-3">
              <span aria-hidden className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: FASE_COLOR[i] }} />
              <span><span className="font-bold">{f}</span><span className="block text-sm text-muted">{DETALLE[i]}</span></span>
            </li>
          ))}
        </ol>
      </section>

      <section className="tarjeta divide-y divide-line">
        <h2 className="p-5 text-xl font-bold sm:px-6">Preguntas frecuentes</h2>
        {PREGUNTAS.map(([p, r]) => (
          <details key={p} className="group px-5 py-4 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
              {p}<span aria-hidden className="text-xl leading-none text-muted transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm text-muted">{r}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
