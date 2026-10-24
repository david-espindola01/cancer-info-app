"use client";

import { useState, useSyncExternalStore } from "react";
import { canSaveOffline, removeTopic, saveTopic } from "./offline-library";
import { getNothing, getSaved, subscribe, type ReadTopic } from "./reading-history";

const noSubscription = () => () => {};

/**
 * «Guardar sin señal»: keeps this page on the phone. Only shown where the phone
 * can do it; what was saved is listed in «Mis temas».
 */
export function SaveOfflineButton({ topic }: { topic: ReadTopic }) {
  const available = useSyncExternalStore(noSubscription, canSaveOffline, () => false);
  const saved = useSyncExternalStore(subscribe, getSaved, getNothing).some((item) => item.slug === topic.slug);
  const [state, setState] = useState<"idle" | "saving" | "failed">("idle");

  if (!available) return null;

  async function save() {
    setState("saving");
    setState((await saveTopic(topic)) ? "idle" : "failed");
  }

  if (saved) {
    return (
      <p className="flex flex-wrap items-center gap-2">
        <span role="status" className="color-monte solid rounded-full px-3 py-1 text-base font-extrabold">
          ✓ Guardada sin señal
        </span>
        <button type="button" onClick={() => void removeTopic(topic)} className="topic-link text-base">
          Quitar
        </button>
      </p>
    );
  }

  return (
    <p className="flex flex-col items-start gap-1">
      <button type="button" onClick={() => void save()} disabled={state === "saving"} className="pill-button">
        {state === "saving" ? "Guardando…" : "⤓ Guardar sin señal"}
      </button>
      {state === "failed" && (
        <span role="alert" className="text-base">
          No se pudo guardar. Inténtalo de nuevo cuando tengas señal.
        </span>
      )}
    </p>
  );
}
