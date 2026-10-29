export default function Cargando() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Cargando">
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"><div className="esqueleto h-72" /><div className="esqueleto h-72" /></div>
      <div className="grid gap-5 sm:grid-cols-3"><div className="esqueleto h-28" /><div className="esqueleto h-28" /><div className="esqueleto h-28" /></div>
      <div className="esqueleto h-96" />
    </div>
  );
}
