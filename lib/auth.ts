import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// `cache` evita repetir las consultas de sesión y perfil entre layout y página en la misma petición.
export const getSessionProfile = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  // Cuenta desactivada por un administrador: una sesión que ya estaba abierta deja de valer al instante.
  if (user.banned_until && new Date(user.banned_until).getTime() > Date.now()) return { supabase, user: null, profile: null as Profile | null };
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { supabase, user, profile: (data as Profile | null) };
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
  if (!s.user || !s.profile) redirect("/equipo/login");
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
