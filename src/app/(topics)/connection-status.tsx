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

/** Where a page is in the line to use the AI: how many go before it and roughly for how long. */
export interface QueuePlace {
  ahead: number;
  waitMs: number;
}

/** From this wait on, the person is told there is a line instead of «unos segundos». */
const LONG_WAIT_MS = 10_000;

function approximately(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  if (ms < 60_000) return "menos de un minuto";
  if (minutes > 60) return "más de una hora";
  return minutes === 1 ? "un minuto" : `unos ${minutes} minutos`;
}

function inLine({ ahead, waitMs }: QueuePlace): string {
  const before = ahead === 1 ? "Antes de esta hay 1 página en preparación. " : `Antes de esta hay ${ahead} páginas en preparación. `;
  return (
    "Hay mucha gente consultando en este momento. " +
    (ahead > 0 ? before : "") +
    `Tiempo estimado: ${approximately(waitMs)}. Mientras tanto puedes leer las páginas que ya están listas.`
  );
}

/** Message of the loading screen: tells «preparing», «waiting in line» and «waiting for the signal» apart. */
export function LoadingMessage({ place }: { place?: QueuePlace }) {
  const waitingInLine = place && (place.ahead > 0 || place.waitMs >= LONG_WAIT_MS);
  return (
    <p role="status" className="text-lg font-semibold">
      {useOffline()
        ? "Sin conexión: esta página se cargará apenas vuelva la señal."
        : waitingInLine
          ? inLine(place)
          : "Estamos preparando esta información… La primera vez puede tardar unos segundos."}
    </p>
  );
}
