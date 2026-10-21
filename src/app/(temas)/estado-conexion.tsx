"use client";

import { useOffline } from "next/offline";

/** Aviso permanente mientras no hay señal: lo ya cargado se puede seguir leyendo. */
export function AvisoSinConexion() {
  if (!useOffline()) return null;
  return (
    <p role="status" className="rounded-xl border-l-8 border-aviso-importante bg-aviso-importante-fondo p-3 font-semibold">
      Sin señal. Puedes seguir leyendo lo que ya cargó; lo nuevo aparecerá cuando vuelva la conexión.
    </p>
  );
}

/** Mensaje de la pantalla de carga: distingue «preparando» de «esperando la señal». */
export function MensajeCarga() {
  return (
    <p role="status" className="text-lg font-semibold">
      {useOffline()
        ? "Sin conexión: esta página se cargará apenas vuelva la señal."
        : "Estamos preparando esta información… La primera vez puede tardar unos segundos."}
    </p>
  );
}
