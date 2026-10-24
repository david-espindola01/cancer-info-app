"use client";

import { useState } from "react";
import { TrashIcon } from "@/ui/icons";
import type { DocumentView } from "../api/http";

const STATUS_LABEL: Record<DocumentView["status"], string> = {
  pending: "En espera de lectura",
  processing: "Leyendo…",
  ready: "Listo",
  error: "Error",
};

/** What is being done right now with a document (for example, «Leyendo parte 2 de 5…»). */
export interface Activity {
  id: string;
  message: string;
}

interface Props {
  documents: DocumentView[];
  activity: Activity | null;
  onRetry: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export function DocumentList({ documents, activity, onRetry, onToggle, onDelete }: Props) {
  // The article whose deletion is waiting for confirmation.
  const [confirming, setConfirming] = useState<string | null>(null);

  if (documents.length === 0) {
    return <p className="mt-4">Todavía no hay artículos subidos.</p>;
  }
  return (
    <ul aria-label="Artículos subidos" className="mt-4 flex flex-col gap-3">
      {documents.map((document) => {
        const reading = activity?.id === document.id;
        return (
          <li
            key={document.id}
            className={`rounded-2xl border-2 px-4 py-3 ${document.active ? "border-border bg-surface" : "border-dashed border-border"}`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className={`min-w-0 flex-1 ${document.active ? "" : "text-muted"}`}>
                <p className="font-semibold">{document.title}</p>
                <p aria-live="polite">
                  {reading ? activity.message : STATUS_LABEL[document.status]}
                  {document.error && ` — ${document.error}`}
                </p>
                {!document.active && <p className="text-base">Apagado: el agente no lo usa en la página.</p>}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={document.active}
                  aria-label={`Usar «${document.title}» en la página`}
                  disabled={reading}
                  onClick={() => onToggle(document.id, !document.active)}
                  className="flex items-center gap-2 font-semibold disabled:opacity-60"
                >
                  <span
                    aria-hidden
                    className={`relative h-7 w-12 rounded-full transition-colors ${document.active ? "bg-accent" : "bg-border"}`}
                  >
                    <span
                      className={`absolute top-1 size-5 rounded-full bg-background transition-all ${document.active ? "left-6" : "left-1"}`}
                    />
                  </span>
                  <span aria-hidden>{document.active ? "En uso" : "Apagado"}</span>
                </button>
                <button
                  type="button"
                  disabled={reading}
                  onClick={() => setConfirming(document.id)}
                  className="color-barro flex items-center gap-1 rounded-xl px-2 py-1 font-semibold text-(--c) hover:bg-(--cf) disabled:opacity-60"
                >
                  <TrashIcon />
                  Eliminar
                </button>
              </div>
            </div>
            {document.status === "error" && (
              <button
                type="button"
                disabled={activity !== null}
                onClick={() => onRetry(document.id)}
                className="mt-2 rounded-xl border-2 border-current px-3 py-1 font-semibold disabled:opacity-60"
              >
                Reintentar
              </button>
            )}
            {confirming === document.id && (
              <div role="alertdialog" aria-label="Confirmar eliminación" className="color-barro mt-3 rounded-xl bg-(--cf) p-3">
                <p>
                  ¿Eliminar «{document.title}»? Se borra lo que el agente aprendió de este artículo y las páginas que lo
                  usaban se vuelven a preparar sin él. Si solo quieres dejar de usarlo por un tiempo, mejor apágalo.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(null);
                      onDelete(document.id);
                    }}
                    className="rounded-xl bg-(--c) px-3 py-1 font-semibold text-background"
                  >
                    Sí, eliminar
                  </button>
                  <button type="button" onClick={() => setConfirming(null)} className="rounded-xl px-3 py-1 font-semibold">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
