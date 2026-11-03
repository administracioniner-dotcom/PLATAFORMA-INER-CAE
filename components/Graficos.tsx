type Serie = { nombre: string; color: string; valores: number[] };

/** Gráfica de barras (apiladas si hay varias series) en SVG, con tabla oculta para lectores de pantalla. */
/** Techo "redondo" del eje: enteros pares para recuentos; 1, 1,2, 1,5, 2, 2,5, 3, 4, 5, 6, 8 o 10 × 10ⁿ para importes. */
function techoRedondo(max: number, entero: boolean) {
  if (entero) return Math.max(2, Math.ceil(max / 2) * 2);
  const e = Math.pow(10, Math.floor(Math.log10(max)));
  const m = max / e;
  return ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((c) => c >= m) ?? 10) * e;
}

type Props = { meses: string[]; series: Serie[]; formato?: (n: number) => string; titulo: string; entero?: boolean; llenar?: boolean; lg?: { W: number; H: number }; resaltarUltimo?: boolean };

/** Dos dibujos con distinta proporción (móvil y escritorio) para que el texto se lea bien en ambos. */
export function Barras(p: Props) {
  const { meses, series, titulo, formato = (n: number) => String(n), llenar = false, lg = { W: 1100, H: 260 } } = p;
  return (
    <figure className={llenar ? "lg:flex lg:h-full lg:min-h-0 lg:flex-col" : undefined}>
      <div className="sm:hidden"><Dibujo {...p} W={340} H={230} clase="w-full" /></div>
      <div className="hidden sm:block lg:hidden"><Dibujo {...p} W={600} H={220} clase="w-full" /></div>
      <div className={llenar ? "hidden lg:block lg:min-h-0 lg:flex-1" : "hidden lg:block"}><Dibujo {...p} W={lg.W} H={lg.H} clase={llenar ? "h-full w-full" : "w-full"} /></div>
      {series.length > 1 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {series.map((s) => <li key={s.nombre} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.nombre}</li>)}
        </ul>
      )}
      <figcaption className="sr-only">
        <table><caption>{titulo}</caption>
          <thead><tr><th>Mes</th>{series.map((s) => <th key={s.nombre}>{s.nombre}</th>)}</tr></thead>
          <tbody>{meses.map((m, i) => <tr key={m + i}><td>{m}</td>{series.map((s) => <td key={s.nombre}>{formato(s.valores[i] ?? 0)}</td>)}</tr>)}</tbody>
        </table>
      </figcaption>
    </figure>
  );
}

function Dibujo({ meses, series, formato = (n) => String(n), titulo, entero = false, resaltarUltimo = false, W, H, clase }: Props & { W: number; H: number; clase: string }) {
  const L = 44, B = 28, T = 12, R = 8;
  const totales = meses.map((_, i) => series.reduce((a, s) => a + (s.valores[i] ?? 0), 0));
  const techo = techoRedondo(Math.max(...totales, 1), entero);
  const alto = H - B - T;
  const ancho = (W - L - R) / meses.length;
  const barra = Math.min(46, ancho * 0.56);
  const guias = [0, 0.5, 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={clase} role="img" aria-label={titulo}>
      {guias.map((g) => {
        const y = T + alto - alto * g;
        return (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y} y2={y} stroke="#E5E7EB" strokeDasharray={g === 0 ? undefined : "3 4"} />
            <text x={L - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#4A5565">{formato(techo * g)}</text>
          </g>
        );
      })}
      {meses.map((m, i) => {
        const cx = L + ancho * i + ancho / 2;
        let acumulado = 0;
        const etiqueta = `${m}: ${formato(totales[i])}`;
        const tw = etiqueta.length * 6.6 + 18;
        const altoBarra = (totales[i] / techo) * alto;
        const ty = Math.max(T + alto - altoBarra - 34, 2);
        const tx = Math.min(Math.max(cx - tw / 2, 2), W - tw - 2);
        return (
          <g key={m + i} className="col-g" tabIndex={0} aria-label={etiqueta}>
            <rect className="hit" x={L + ancho * i} y={T} width={ancho} height={alto + B - 6} fill="transparent" />
            {series.map((s) => {
              const v = s.valores[i] ?? 0;
              if (v <= 0) return null;
              const h = (v / techo) * alto;
              const y = T + alto - acumulado - h + (series.length > 1 ? 0.75 : 0);
              acumulado += h;
              return (
                <rect key={s.nombre} x={cx - barra / 2} y={y} width={barra} height={Math.max(series.length > 1 ? h - 1.5 : h, 2)} rx={series.length > 1 ? 3 : 4} fill={s.color} opacity={resaltarUltimo && i < meses.length - 1 ? 0.6 : 1} className="barra" style={{ ["--i" as string]: i }} />
              );
            })}
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="12" fill="#4A5565" fontWeight={resaltarUltimo && i === meses.length - 1 ? 700 : 400}>{m}</text>
            <g className="tip">
              <rect x={tx} y={ty} width={tw} height={24} rx={8} fill="#021037" />
              <text x={tx + tw / 2} y={ty + 16} textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff">{etiqueta}</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
