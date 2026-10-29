import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const token_hash = req.nextUrl.searchParams.get("token_hash");
  const type = req.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = req.nextUrl.searchParams.get("next") ?? "/crear-contrasena";
  const dest = req.nextUrl.clone();
  dest.search = "";
  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) { dest.pathname = next.startsWith("/") ? next : "/crear-contrasena"; return NextResponse.redirect(dest); }
  }
  dest.pathname = "/recuperar";
  dest.searchParams.set("caducado", "1");
  return NextResponse.redirect(dest);
}
