# Portal de colaboradores CAE · INER

Next.js 15 + Tailwind + Supabase (proyecto `portal-colaboradores-cae`, Fráncfort), desplegado en Vercel.

## Variables de entorno (Vercel → Settings → Environment Variables)
| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (*publishable*) de Supabase. Es pública por diseño: la seguridad la dan las políticas RLS. |
| `AVISO_CHAT_WEBHOOK` | *(opcional)* URL del webhook de un espacio de Google Chat. Es un secreto. Ver «Avisos de mensajes nuevos». |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → *secret*. **Solo servidor, nunca en el código.** Marcar como *Sensitive*. |

## Cuentas
No se usa el correo para dar de alta ni para recuperar contraseñas:
- Un administrador crea cada cuenta en `/equipo/invitar` ("Crear colaborador") con correo, contraseña y rol, y se la entrega a la persona.
- Si alguien olvida la contraseña, el administrador la cambia desde esa misma pantalla (lista "Cuentas") o desde la ficha del colaborador. Cada cuenta puede cambiar la suya desde "Mi perfil".
- El alta y el cambio de contraseña por un administrador quedan en `audit_log` (sin guardar nunca la contraseña).

## Avisos de mensajes nuevos
Cuando un colaborador escribe en el portal, el equipo recibe un aviso en Google Chat: «Mensaje nuevo de [colaborador]» con un enlace a la conversación.
- **Agrupado:** como máximo un aviso cada 10 minutos por colaborador; una ráfaga de mensajes genera un solo aviso (`lib/avisos.ts`, tabla `avisos_mensajes`).
- **No avisa** de los mensajes del equipo ni de los avisos automáticos del sistema.
- **Destinatarios:** quien esté en el espacio de Chat. Para que solo lo vean los administradores, crea un espacio con únicamente ellos.
- **Configurarlo:** en el espacio de Google Chat → nombre del espacio → *Aplicaciones e integraciones* → *Webhooks* → añadir webhook → copiar la URL. Pégala en Vercel como variable `AVISO_CHAT_WEBHOOK` (Production) y vuelve a desplegar. Sin la variable, simplemente no se envía ningún aviso.
- Solo se envía a `chat.googleapis.com`; si el aviso falla, el mensaje ya está guardado y se reintenta con el siguiente.

## Seguridad
- **Registro cerrado en la base de datos:** el disparador `handle_new_user` solo crea perfiles para cuentas con `app_metadata.creada_por_admin = true`, algo que solo se puede escribir con la clave de servidor. El registro público de Supabase no puede crear cuentas aunque esté activo. Recomendado además: Authentication → Sign In / Providers → desactivar *Allow new users to sign up*.
- **RLS en todas las tablas** y permisos mínimos para el rol `authenticated` (sin `TRUNCATE`, sin escritura en vistas ni en auditoría). Los colaboradores solo ven y tocan lo suyo; crear clientes, cambiar fase, MWh, % y marcar pagos es solo del equipo.
- **El navegador nunca habla con Supabase:** todo pasa por el servidor. No hay clientes de Supabase en el frontend, ni `localStorage`, ni contraseñas o tokens en JavaScript. Las cookies de sesión son `httpOnly`.
- **Cabeceras:** CSP estricta, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS (ver `next.config.mjs`).
- **Límite de intentos de acceso** (`lib/intentos.ts`, tabla `intentos_login`): 5 fallos por cuenta desde una misma IP, 20 por IP o 30 por cuenta (ataque distribuido) en 15 minutos bloquean nuevos intentos. Se cuenta con la IP real del visitante porque Supabase, al recibir el login desde Vercel, no la ve. Los fallos se borran a los 7 días.
- **Validación en el servidor** de todos los datos de entrada (longitudes, formatos, rangos) en `app/actions.ts`.
- La exportación a Excel neutraliza fórmulas (`=`, `+`, `-`, `@`).

## Rutas
- Colaborador: `/login`, `/` (panel), `/mensajes`, `/perfil`, `/soporte`
- Equipo: `/equipo/login`, `/equipo`, `/equipo/colaboradores/[id]` (alta de clientes y pagos), `/equipo/mensajes`, `/equipo/perfil`, `/equipo/invitar` (solo admin), `/equipo/exportar` (CSV para Excel)

El rol siempre lo decide el servidor según la cuenta (tabla `profiles`), no la URL.
