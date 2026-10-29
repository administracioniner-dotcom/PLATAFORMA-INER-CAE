"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Vuelve a pedir los datos de la página cada cierto tiempo, solo si la pestaña está a la vista. */
export function AutoRefresh({ cada = 30 }: { cada?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, cada * 1000);
    return () => clearInterval(id);
  }, [router, cada]);
  return null;
}
