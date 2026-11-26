import Link from "next/link";
import { Marca } from "@/components/Marca";
import { Pie } from "@/components/Pie";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-panel">
        <div className="contenedor flex items-center justify-between py-3">
          <Link href="/login" aria-label="Volver al acceso"><Marca className="h-9" /></Link>
          <Link href="/login" className="btn btn-ghost !px-4 !py-1.5">Volver al acceso</Link>
        </div>
      </header>
      <main className="contenedor w-full flex-1 py-8">{children}</main>
      <Pie />
    </div>
  );
}
