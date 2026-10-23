"use client";

import { useState, useSyncExternalStore } from "react";
import { canSaveOffline, removeTopic, saveTopic } from "./offline-library";
import { getNothing, getSaved, subscribe, type ReadTopic } from "./reading-history";

const noSubscription = () => () => {};
const buttonClass = "rounded-lg border border-border bg-surface px-4 py-2 font-semibold";

/**
 * «Guardar para leer sin señal»: keeps this page on the phone. Only shown where the phone
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
        <span role="status" className="font-semibold text-accent">
          ✓ Guardada para leer sin señal
        </span>
        <button type="button" onClick={() => void removeTopic(topic)} className="topic-link text-base">
          Quitar
        </button>
      </p>
    );
  }

  return (
    <p className="flex flex-col items-start gap-1">
      <button type="button" onClick={() => void save()} disabled={state === "saving"} className={buttonClass}>
        {state === "saving" ? "Guardando…" : "⤓ Guardar para leer sin señal"}
      </button>
      {state === "failed" && (
        <span role="alert" className="text-base">
          No se pudo guardar. Inténtalo de nuevo cuando tengas señal.
        </span>
      )}
    </p>
  );
}
