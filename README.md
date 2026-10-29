# Portal de Colaboradores CAE · INER

Next.js 15 + Tailwind + Supabase (proyecto `portal-colaboradores-cae`, Frankfurt). Sin n8n.

## Variables de entorno (Vercel → Settings → Environment Variables)
| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://iuaevuahydpzzpbwivzw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_4YRkbrwF9LhPgNlHlfPEkg_SrNyemEb` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → *secret*. Solo servidor, nunca en el código. Marcar como Sensitive. |
| `NEXT_PUBLIC_SITE_URL` | URL del portal, p. ej. `https://xxx.vercel.app` (sin barra final) |

## Configuración en Supabase (una vez)
1. **Authentication → URL Configuration:** Site URL = la URL del portal. Redirect URLs: `https://TU-URL/auth/confirm`.
2. **Authentication → Sign In / Providers:** desactivar *Allow new users to sign up*.
3. **Authentication → Email Templates.** Cambiar el enlace de cada plantilla para que apunte al portal:
   - *Invite user*: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/crear-contrasena">Crear mi contraseña</a>`
   - *Reset password*: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/crear-contrasena">Crear contraseña nueva</a>`
4. **Authentication → SMTP Settings:** SMTP propio (p. ej. Resend) para enviar desde el dominio de INER.

## Primer acceso de los administradores
`laura.garcia@iner.es` y `jose.gutierrez@iner.es` ya están autorizados en la base de datos.
Como aún no tienen cuenta, créalas desde Supabase → Authentication → Users → *Invite user*
(o pulsa "Recuperar contraseña" en `/recuperar`, que solo funciona si la cuenta existe).
Después entran por `/equipo/login` y desde `/equipo/invitar` invitan al resto.

## Rutas
- Colaborador: `/login`, `/` (mis clientes, solo lectura y solicitar pago), `/mensajes`
- Equipo: `/equipo/login`, `/equipo`, `/equipo/colaboradores/[id]` (aquí se dan de alta los clientes), `/equipo/mensajes`, `/equipo/invitar` (solo admin)
- Enlaces de correo: `/auth/confirm`, `/crear-contrasena`, `/recuperar`

**Los clientes los crea solo el equipo** (delegado o admin), desde la ficha de cada colaborador. Los colaboradores no pueden crearlos: lo impide la política RLS `clientes_insert` (`es_staff()`).

El rol siempre lo decide el servidor según la cuenta (tabla `profiles`), no la URL.
