"use client";
import { avisar } from "@/lib/avisar";
import type { Estado } from "@/app/actions";

/** Formulario que ejecuta una acción del servidor y confirma el resultado con un aviso breve. */
export function FormAviso({ action, children, className, ok = "Guardado" }: {
  action: (fd: FormData) => Promise<Estado | void>; children: React.ReactNode; className?: string; ok?: string;
}) {
  return (
    <form className={className} action={async (fd) => {
      const r = await action(fd);
      if (r?.error) avisar(r.error, "error"); else avisar(r?.ok ?? ok);
    }}>{children}</form>
  );
}
