import { getSessionProfile } from "@/lib/auth";
import { FASES, VALOR_MWH } from "@/lib/utils";
import type { ClienteStaff, Profile } from "@/lib/types";

const PAGO = { none: "Sin solicitar", requested: "Solicitado", paid: "Pagado" } as const;
const celda = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const decimal = (n: number | null) => (n == null ? "" : String(n).replace(".", ","));
const dia = (s: string | null) => (s ? s.slice(0, 10) : "");

/** CSV con todos los clientes (activos y archivados), listo para abrir en Excel. Solo equipo. */
export async function GET() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.rol === "colaborador") return new Response("No autorizado", { status: 403 });
  const [{ data: ps }, { data: cs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("rol", "colaborador").order("nombre"),
    supabase.from("clientes").select("*").order("created_at"),
  ]);
  const colab = new Map(((ps ?? []) as Profile[]).map((p) => [p.id, p]));
  const filas = [["Colaborador", "Correo", "Cliente", "Fase", "MWh", "% colaborador", "Comisión (€)", "Pago", "Alta", "Archivado"]];
  for (const c of (cs ?? []) as ClienteStaff[]) {
    const p = colab.get(c.colaborador_id);
    const comision = c.mwh == null ? null : Math.round(c.mwh * VALOR_MWH * c.pct) / 100;
    filas.push([p?.nombre ?? "", p?.email ?? "", c.nombre, FASES[c.fase], decimal(c.mwh), decimal(c.pct), decimal(comision), PAGO[c.pago], dia(c.created_at), dia(c.archivado_at)] as string[]);
  }
  // BOM + punto y coma: Excel en español lo abre con tildes y columnas bien separadas.
  const csv = "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-iner-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
