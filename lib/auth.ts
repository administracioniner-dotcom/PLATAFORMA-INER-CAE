import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

type Sesion = { supabase: Awaited<ReturnType<typeof createClient>>; user: User | null; profile: Profile | null; mfaPendiente?: boolean };

/** ¿Tiene esta persona una verificación en dos pasos (TOTP) ya confirmada? */
export const tieneDosPasos = (user: Pick<User, "factors">) => (user.factors ?? []).some((f) => f.factor_type === "totp" && f.status === "verified");
/** Interruptor: con MFA_ADMIN_OBLIGATORIO=1 todos los administradores deben activar los dos pasos para entrar. */
export const dosPasosObligatorio = () => process.env.MFA_ADMIN_OBLIGATORIO === "1";

// `cache` evita repetir las consultas de sesión y perfil entre layout y página en la misma petición.
export const getSessionProfile = cache(async (): Promise<Sesion> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  // Cuenta desactivada por un administrador: una sesión que ya estaba abierta deja de valer al instante.
  if (user.banned_until && new Date(user.banned_until).getTime() > Date.now()) return { supabase, user: null, profile: null };
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = data as Profile | null;
  // Un administrador con dos pasos activados (o con el interruptor obligatorio) solo entra con el segundo factor ya verificado (aal2).
  // Sin él no hay sesión a efectos de la aplicación, tampoco en las acciones del servidor.
  if (profile?.rol === "admin" && (tieneDosPasos(user) || dosPasosObligatorio())) {
    const { data: c } = await supabase.auth.getClaims();
    if ((c?.claims as { aal?: string } | undefined)?.aal !== "aal2") return { supabase, user: null, profile: null, mfaPendiente: true };
  }
  return { supabase, user, profile };
});

export async function requireColaborador() {
  const s = await getSessionProfile();
  if (!s.user || !s.profile) redirect("/login");
  if (s.profile.rol === "cliente") redirect("/cliente");
  if (s.profile.rol !== "colaborador") redirect("/equipo");
  return { ...s, profile: s.profile };
}

export async function requireStaff() {
  const s = await getSessionProfile();
  if (!s.user || !s.profile) redirect(s.mfaPendiente ? "/equipo/2fa" : "/equipo/login");
  if (s.profile.rol === "cliente") redirect("/cliente");
  if (s.profile.rol === "colaborador") redirect("/");
  return { ...s, profile: s.profile };
}

/** Cliente directo de INER: solo entra a su propio portal. */
export async function requireCliente() {
  const s = await getSessionProfile();
  if (!s.user || !s.profile) redirect("/cliente/login");
  if (s.profile.rol !== "cliente") redirect(s.profile.rol === "colaborador" ? "/" : "/equipo");
  return { ...s, profile: s.profile };
}
