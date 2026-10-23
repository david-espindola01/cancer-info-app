"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentView } from "../api/http";
import { changeDocumentActive, deleteDocument, fetchDocuments } from "./api-client";
import { DocumentList, type Activity } from "./document-list";
import { LoginForm } from "./login-form";
import { PdfPicker } from "./pdf-picker";
import { readDocument } from "./read-document";
import { UsagePanel } from "./usage-panel";

type State =
  | { phase: "loading" }
  | { phase: "login" }
  | { phase: "ready"; documents: DocumentView[] }
  | { phase: "error"; message: string };

function loadState(): Promise<State> {
  return fetchDocuments().then(
    (documents): State => (documents ? { phase: "ready", documents } : { phase: "login" }),
    (error: Error): State => ({ phase: "error", message: error.message }),
  );
}

export function UploadPanel() {
  const [state, setState] = useState<State>({ phase: "loading" });
  const [activity, setActivity] = useState<Activity | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  // One document is read at a time: the AI's limit is per minute.
  const reading = useRef(false);

  const load = useCallback(() => {
    void loadState().then(setState);
  }, []);

  const read = useCallback(
    (id: string) => {
      if (reading.current) return;
      reading.current = true;
      void readDocument(id, (message) => setActivity({ id, message })).finally(() => {
        reading.current = false;
        setActivity(null);
        load();
      });
    },
    [load],
  );

  useEffect(load, [load]);

  /** Turns an article on or off, or deletes it, and shows the list as it is now. */
  const change = useCallback(
    async (action: () => Promise<string | null>) => {
      setFailure(await action());
      load();
    },
    [load],
  );

  // Automatically reads, one by one, the documents waiting to be read.
  const next =
    state.phase === "ready"
      ? state.documents.find((d) => d.status === "pending" || d.status === "processing")?.id
      : undefined;
  useEffect(() => {
    if (next) read(next);
  }, [next, read]);

  switch (state.phase) {
    case "loading":
      return <p className="mt-6">Cargando…</p>;
    case "login":
      return <LoginForm onLogin={load} />;
    case "error":
      return (
        <p role="alert" className="mt-6 font-semibold">
          {state.message}
        </p>
      );
    case "ready":
      return (
        <>
          <PdfPicker onUpload={load} />
          <h2 className="mt-8 text-xl font-bold">Artículos</h2>
          {failure && (
            <p role="alert" className="mt-4 font-semibold">
              {failure}
            </p>
          )}
          <DocumentList
            documents={state.documents}
            activity={activity}
            onRetry={read}
            onToggle={(id, active) => void change(() => changeDocumentActive(id, active))}
            onDelete={(id) => void change(() => deleteDocument(id))}
          />
          <UsagePanel version={state.documents.map((d) => `${d.status}${d.active}`).join()} />
        </>
      );
  }
}
