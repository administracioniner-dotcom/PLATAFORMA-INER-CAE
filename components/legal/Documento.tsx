import { LEGAL } from "@/lib/legal";

/** Marco común de las páginas legales: título, fecha, aviso de borrador y el texto con su estilo. */
export function Documento({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl">
      <p className="eyebrow !mb-0">Información legal</p>
      <h1 className="text-3xl font-bold tracking-[-0.02em]">{titulo}</h1>
      <p className="mt-1 text-sm text-muted">Última actualización: {LEGAL.actualizado}</p>
      {LEGAL.borrador && (
        <p role="note" className="mt-4 rounded-xl bg-sun-50 px-4 py-3 text-sm text-sun-700">
          Texto base pendiente de revisión legal. Los datos entre corchetes se completan antes de darlo por definitivo.
        </p>
      )}
      <div className="mt-6 space-y-3 text-[15px] leading-relaxed text-ink [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </article>
  );
}
