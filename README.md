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

## Cuentas
No se usa el correo para dar de alta ni para recuperar contraseñas:
- Un administrador crea cada cuenta en `/equipo/invitar` ("Crear colaborador") con correo, contraseña y rol, y se la entrega a la persona.
- Si alguien olvida la contraseña, el administrador la cambia desde esa misma pantalla (lista "Cuentas") o desde la ficha del colaborador.
- Primer administrador: `jose.gutierrez@iner.es` ya tiene cuenta. Para `laura.garcia@iner.es`, créala desde "Crear colaborador" con rol Administrador.
- Las rutas `/recuperar`, `/crear-contrasena` y `/auth/confirm` siguen en el código por si se activa más adelante el envío de correos (requiere SMTP propio, ver arriba), pero no se enlazan desde la interfaz.

## Rutas
- Colaborador: `/login`, `/` (mis clientes, solo lectura y solicitar pago), `/mensajes`
- Equipo: `/equipo/login`, `/equipo`, `/equipo/colaboradores/[id]` (aquí se dan de alta los clientes), `/equipo/mensajes`, `/equipo/invitar` (solo admin)
- Enlaces de correo: `/auth/confirm`, `/crear-contrasena`, `/recuperar`

**Los clientes los crea solo el equipo** (delegado o admin), desde la ficha de cada colaborador. Los colaboradores no pueden crearlos: lo impide la política RLS `clientes_insert` (`es_staff()`).

El rol siempre lo decide el servidor según la cuenta (tabla `profiles`), no la URL.
