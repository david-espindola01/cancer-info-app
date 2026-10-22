import type { StepResult } from "@/application/reading/process-next-step";
import type { DocumentView } from "../api/http";

export type StepResultView = Exclude<StepResult, { kind: "not-found" }>;

const JSON_HEADERS = { "Content-Type": "application/json" };

async function errorMessage(response: Response): Promise<string> {
  try {
    const body: { error?: unknown } = await response.json();
    if (typeof body.error === "string") return body.error;
  } catch {
    // The body was not JSON: the generic message is used.
  }
  return `El servidor respondió con un error (${response.status}).`;
}

/** The list of documents, or null if there is no session. */
export async function fetchDocuments(): Promise<DocumentView[] | null> {
  const response = await fetch("/api/documents", { cache: "no-store" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(await errorMessage(response));
  return (await response.json()).documents;
}

/** Returns null if the session started, or the error message. */
export async function requestSession(password: string): Promise<string | null> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ password }),
  });
  return response.ok ? null : errorMessage(response);
}

export interface SystemStatus {
  usageToday: Record<string, number>;
  readyPages: number;
}

/** AI usage today and ready pages; null if it could not be fetched. */
export async function fetchStatus(): Promise<SystemStatus | null> {
  const response = await fetch("/api/status", { cache: "no-store" });
  return response.ok ? response.json() : null;
}

/** Asks the server to move a document's reading one step forward. */
export async function requestStep(id: string): Promise<StepResultView> {
  const response = await fetch(`/api/documents/${id}/step`, { method: "POST" });
  return response.ok ? response.json() : { kind: "error", message: await errorMessage(response) };
}

export async function sendDocument(title: string, text: string): Promise<{ ok: boolean; message: string }> {
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ title, text }),
  });
  return response.ok
    ? { ok: true, message: "Subido. Queda en espera de lectura." }
    : { ok: false, message: await errorMessage(response) };
}
