/** Ilustraciones de línea propias de INER (SVG, trazo en currentColor). Sin emojis ni fotos de stock. */
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function Sol({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden {...base}>
      <circle cx="60" cy="60" r="20" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <line key={i} x1={60 + Math.cos(a) * 32} y1={60 + Math.sin(a) * 32} x2={60 + Math.cos(a) * 46} y2={60 + Math.sin(a) * 46} />;
      })}
    </svg>
  );
}

export function Bateria({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden {...base}>
      <rect x="14" y="36" width="84" height="48" rx="9" />
      <rect x="98" y="50" width="9" height="20" rx="3" />
      <rect x="24" y="46" width="14" height="28" rx="3" fill="currentColor" stroke="none" opacity=".9" />
      <rect x="44" y="46" width="14" height="28" rx="3" fill="currentColor" stroke="none" opacity=".55" />
      <rect x="64" y="46" width="14" height="28" rx="3" fill="currentColor" stroke="none" opacity=".25" />
    </svg>
  );
}

export function Red({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden {...base}>
      <path d="M60 12 L38 112 M60 12 L82 112" />
      <path d="M54 40 H66 M49 62 H71 M45 82 H75 M36 26 H84" />
      <path d="M36 26 Q14 48 4 62 M84 26 Q106 48 116 62" />
      <path d="M36 26 V32 M84 26 V32" />
    </svg>
  );
}

/** Escena para el login: casa con paneles solares, sol y batería. */
export function EscenaSolar({ className = "w-full max-w-md" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 300" className={className} aria-hidden {...base} strokeWidth={2.5}>
      <circle cx="338" cy="64" r="26" />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5;
        return <line key={i} x1={338 + Math.cos(a) * 38} y1={64 + Math.sin(a) * 38} x2={338 + Math.cos(a) * 54} y2={64 + Math.sin(a) * 54} />;
      })}
      <path d="M40 270 H380" />
      <path d="M70 270 V150 L150 90 L230 150 V270" />
      <rect x="120" y="200" width="42" height="70" rx="4" />
      <path d="M100 138 L150 100 L200 138" opacity=".0" />
      <g transform="rotate(-37 150 90)">
        <rect x="104" y="86" width="92" height="30" rx="3" fill="currentColor" fillOpacity=".18" />
        <path d="M135 86 V116 M165 86 V116 M104 101 H196" />
      </g>
      <rect x="262" y="206" width="76" height="64" rx="9" />
      <rect x="338" y="224" width="9" height="26" rx="3" />
      <rect x="272" y="216" width="14" height="44" rx="3" fill="currentColor" stroke="none" opacity=".9" />
      <rect x="292" y="216" width="14" height="44" rx="3" fill="currentColor" stroke="none" opacity=".55" />
      <rect x="312" y="216" width="14" height="44" rx="3" fill="currentColor" stroke="none" opacity=".25" />
      <path d="M230 240 H262" strokeDasharray="2 7" />
    </svg>
  );
}

export function Vacio({ icono, titulo, texto, children, tono = "sun" }: {
  icono: "sol" | "bateria" | "red"; titulo: string; texto: string; children?: React.ReactNode; tono?: "sun" | "batt" | "net";
}) {
  const Dibujo = { sol: Sol, bateria: Bateria, red: Red }[icono];
  const color = { sun: "text-sun", batt: "text-batt", net: "text-net" }[tono];
  return (
    <div className="flex flex-col items-center rounded-2xl bg-soft px-6 py-10 text-center">
      <span className={color}><Dibujo /></span>
      <p className="mt-3 text-lg font-bold">{titulo}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{texto}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
