"use client";
import { useFormStatus } from "react-dom";
import { cx } from "@/lib/utils";

export function Submit({ children, className = "btn-primary", pendiente = "Un momento…" }: { children: React.ReactNode; className?: string; pendiente?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={cx("btn", className)}>{pending ? pendiente : children}</button>;
}
