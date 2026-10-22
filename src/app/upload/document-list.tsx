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
}

export function DocumentList({ documents, activity, onRetry }: Props) {
  if (documents.length === 0) {
    return <p className="mt-4">Todavía no hay artículos subidos.</p>;
  }
  return (
    <ul aria-label="Artículos subidos" className="mt-4 flex flex-col gap-2">
      {documents.map((document) => (
        <li key={document.id} className="rounded border border-current/30 px-3 py-2">
          <p className="font-semibold">{document.title}</p>
          <p aria-live="polite">
            {activity?.id === document.id ? activity.message : STATUS_LABEL[document.status]}
            {document.error && ` — ${document.error}`}
          </p>
          {document.status === "error" && (
            <button
              type="button"
              disabled={activity !== null}
              onClick={() => onRetry(document.id)}
              className="mt-2 rounded border border-current px-3 py-1 font-semibold disabled:opacity-60"
            >
              Reintentar
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
