import { SoporteVista } from "@/components/vistas/Soporte";
import { requireColaborador } from "@/lib/auth";

export default async function Soporte() {
  await requireColaborador();
  return <SoporteVista />;
}
