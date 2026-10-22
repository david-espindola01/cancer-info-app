import { InvalidAnswer, RateLimitExceeded, retryInvalidAnswers } from "../llm-errors";
import type { JsonRequest, LlmProvider } from "../llm-port";
import type { DocumentRepository, MemoryRepository } from "../ports";
import { consolidateNotes } from "./consolidate-notes";
import { asDocument, MEMORY_INSTRUCTIONS, NOTES_INSTRUCTIONS } from "./instructions";
import { memoryOutput, notesOutput } from "./schemas";

/**
 * Cap on the Reader's answer tokens (includes its reasoning). Groq deducts the requested
 * maximum from its per-minute limit: a tight cap avoids pointless waits.
 * Measured with gpt-oss-120b on real articles: notes up to ~1,750 tokens and memory up to
 * ~2,400 tokens; with 3,000 some answers were cut off.
 */
const READER_MAX_TOKENS = 4_000;
/** An invalid answer (for example, one cut off) is requested once more before marking the error. */
const ATTEMPTS = 2;

/** Shown to the team in /upload, so it is in Spanish. */
const INVALID_ANSWER_MESSAGE = "La IA no devolvió una respuesta válida. Se puede reintentar.";

export interface ReadingDependencies {
  documents: DocumentRepository;
  memories: MemoryRepository;
  reader: LlmProvider;
}

export type StepResult =
  | { kind: "progress"; processed: number; total: number }
  | { kind: "wait"; waitMs: number }
  | { kind: "ready" }
  | { kind: "error"; message: string }
  | { kind: "not-found" };

/**
 * Moves the reading of a document one step forward: extracts the notes of the next
 * pending chunk or, when none is left, consolidates the memory. Each call makes at most
 * one request to the model, so it can be repeated and resumed without losing work.
 */
export async function processNextStep(
  documentId: string,
  { documents, memories, reader }: ReadingDependencies,
): Promise<StepResult> {
  const document = await documents.get(documentId);
  if (!document) return { kind: "not-found" };
  if (document.status === "ready") return { kind: "ready" };

  await documents.setStatus(documentId, "processing");
  try {
    const chunk = await documents.nextPendingChunk(documentId);
    const ask = <T>(request: Omit<JsonRequest<T>, "maxOutputTokens">) =>
      retryInvalidAnswers(ATTEMPTS, () => reader.generateJson({ ...request, maxOutputTokens: READER_MAX_TOKENS }));

    if (chunk) {
      const notes = await ask({ output: notesOutput, system: NOTES_INSTRUCTIONS, user: asDocument(chunk.text) });
      await documents.saveNotes(documentId, chunk.position, notes);
      return { kind: "progress", ...(await documents.progress(documentId)) };
    }

    const notes = await documents.listNotes(documentId);
    const memory = await ask({
      output: memoryOutput,
      system: MEMORY_INSTRUCTIONS,
      user: asDocument(consolidateNotes(document.title, notes)),
    });
    await memories.save(documentId, memory);
    await documents.setStatus(documentId, "ready");
    return { kind: "ready" };
  } catch (error) {
    if (error instanceof RateLimitExceeded) return { kind: "wait", waitMs: error.waitMs };
    if (error instanceof InvalidAnswer) {
      await documents.setStatus(documentId, "error", INVALID_ANSWER_MESSAGE);
      return { kind: "error", message: INVALID_ANSWER_MESSAGE };
    }
    throw error;
  }
}
