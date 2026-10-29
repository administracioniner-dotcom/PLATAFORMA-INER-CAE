"use client";
import { useActionState } from "react";
import type { Estado } from "@/app/actions";

export function FormEstado({ action, children, className }: {
  action: (s: Estado, fd: FormData) => Promise<Estado>; children: React.ReactNode; className?: string;
}) {
  const [estado, formAction] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      {estado?.error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{estado.error}</p>}
      {estado?.ok && <p role="status" className="mt-3 text-sm font-medium text-batt-700">{estado.ok}</p>}
    </form>
  );
}
