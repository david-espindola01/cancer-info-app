import { requestStep } from "./api-client";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Requests reading steps until the document is ready or has an error, reporting the
 * progress. When the AI hits its per-minute limit, waits as long as the server says.
 */
export async function readDocument(
  id: string,
  onProgress: (message: string) => void,
  wait: (ms: number) => Promise<void> = sleep,
): Promise<void> {
  for (;;) {
    const result = await requestStep(id).catch(() => ({ kind: "error" as const }));
    switch (result.kind) {
      case "progress":
        onProgress(
          result.processed < result.total
            ? `Leyendo parte ${result.processed + 1} de ${result.total}…`
            : "Escribiendo la memoria del artículo…",
        );
        break;
      case "wait":
        onProgress(`Esperando el límite de uso de la IA (${Math.ceil(result.waitMs / 1000)} s)…`);
        await wait(result.waitMs);
        break;
      case "ready":
      case "error":
        return;
    }
  }
}
