"use client";

import { useOffline } from "next/offline";

/** Permanent notice while there is no signal: what already loaded can still be read. */
export function OfflineNotice() {
  if (!useOffline()) return null;
  return (
    <p role="status" className="color-amber rounded-xl border-l-8 border-(--c) bg-(--cf) p-3 font-semibold">
      Sin señal. Puedes seguir leyendo lo que ya cargó; lo nuevo aparecerá cuando vuelva la conexión.
    </p>
  );
}

/** Message of the loading screen: tells «preparing» apart from «waiting for the signal». */
export function LoadingMessage() {
  return (
    <p role="status" className="text-lg font-semibold">
      {useOffline()
        ? "Sin conexión: esta página se cargará apenas vuelva la señal."
        : "Estamos preparando esta información… La primera vez puede tardar unos segundos."}
    </p>
  );
}
