import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino de los enlaces de correo (invitación y recuperar contraseña).
 * Acepta los dos formatos que puede enviar Supabase:
 *  - `token_hash` + `type`: plantilla de correo propia (funciona aunque el enlace se abra en otro dispositivo).
 *  - `code`: plantilla por defecto con PKCE (solo funciona en el mismo navegador donde se pidió el enlace).
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const token_hash = q.get("token_hash");
  const type = q.get("type") as EmailOtpType | null;
  const code = q.get("code");
  const next = q.get("next") ?? "/crear-contrasena";
  const dest = req.nextUrl.clone();
  dest.search = "";

  const supabase = await createClient();
  let error: unknown = new Error("Enlace sin datos");
  if (token_hash && type) ({ error } = await supabase.auth.verifyOtp({ type, token_hash }));
  else if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));

  if (!error) {
    dest.pathname = next.startsWith("/") && !next.startsWith("//") ? next : "/crear-contrasena";
    return NextResponse.redirect(dest);
  }
  dest.pathname = "/recuperar";
  dest.searchParams.set("caducado", "1");
  return NextResponse.redirect(dest);
}
