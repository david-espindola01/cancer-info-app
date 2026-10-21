"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const sinSuscripcion = () => () => {};
const hayVoz = () => "speechSynthesis" in window;

/**
 * Lee en voz alta la página con la voz del propio teléfono o computador: no usa la red
 * ni tiene costo, y ayuda a quien tiene dificultades para leer.
 */
export function BotonEscuchar() {
  const disponible = useSyncExternalStore(sinSuscripcion, hayVoz, () => false);
  const [hablando, setHablando] = useState(false);

  // Si la persona cambia de página, se deja de leer.
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (!disponible) return null;

  function alternar() {
    const voz = window.speechSynthesis;
    if (hablando) {
      voz.cancel();
      setHablando(false);
      return;
    }
    // innerText respeta las pausas entre bloques (título, párrafos); textContent las junta.
    const articulo = document.querySelector<HTMLElement>("main article");
    const texto = (articulo?.innerText || articulo?.textContent)?.trim();
    if (!texto) return;
    const lectura = new SpeechSynthesisUtterance(texto);
    lectura.lang = "es";
    lectura.rate = 0.95;
    lectura.onend = () => setHablando(false);
    voz.cancel();
    voz.speak(lectura);
    setHablando(true);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={hablando}
      className="self-start rounded-lg border border-borde bg-superficie px-4 py-2 font-semibold"
    >
      {hablando ? "■ Detener lectura" : "▶ Escuchar esta página"}
    </button>
  );
}
