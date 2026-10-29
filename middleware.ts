import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLICAS = ["/login", "/equipo/login", "/recuperar", "/auth"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );
  // Solo decide si hay sesión; la autorización real (rol) se valida en el servidor con getUser().
  // getClaims verifica el JWT en local y evita una llamada de red a Supabase en cada petición.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;
  const path = req.nextUrl.pathname;
  const publica = PUBLICAS.some((p) => path === p || path.startsWith(p + "/"));
  if (!user && !publica) {
    const url = req.nextUrl.clone();
    url.pathname = path.startsWith("/equipo") ? "/equipo/login" : "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
