/** Límites de intentos fallidos de inicio de sesión dentro de la ventana (ver lib/intentos.ts). Sin dependencias para poder probarlo. */
export const VENTANA_MINUTOS = 15;
export const LIMITES = {
  /** Una cuenta desde una misma IP: frena la prueba de contraseñas sin dejar que un tercero bloquee la cuenta a todos. */
  cuentaDesdeUnaIp: 5,
  /** Una misma IP probando muchas cuentas. */
  ip: 20,
  /** Una cuenta atacada desde muchas IPs a la vez (ataque distribuido). */
  cuenta: 30,
} as const;

export type Fallos = { cuentaDesdeUnaIp: number; ip: number; cuenta: number };

export function debeBloquear(f: Fallos): boolean {
  return f.cuentaDesdeUnaIp >= LIMITES.cuentaDesdeUnaIp || f.ip >= LIMITES.ip || f.cuenta >= LIMITES.cuenta;
}
