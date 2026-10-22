"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EsqueletoTema } from "./esqueleto-tema";

/** Mientras la página se prepara (o la IA alcanzó su límite), vuelve a pedirla al servidor. */
export function EsperaTema({ reintentarMs }: { reintentarMs: number }) {
  const router = useRouter();

  useEffect(() => {
    const temporizador = setTimeout(() => router.refresh(), reintentarMs);
    return () => clearTimeout(temporizador);
  }, [router, reintentarMs]);

  return <EsqueletoTema />;
}
