export function Marca({ claro = false }: { claro?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-bold tracking-tight">
      <span className={`grid h-8 w-8 place-items-center rounded-lg text-sm ${claro ? "bg-white text-navy" : "bg-navy text-white"}`}>I</span>
      <span className={claro ? "text-white" : "text-navy"}>INER <span className="font-medium opacity-70">Portal CAE</span></span>
    </span>
  );
}
