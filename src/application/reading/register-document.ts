import type { SourceDocument } from "@/domain/document";
import { chunkText, cleanText, textFingerprint } from "@/domain/text";
import type { DocumentRepository } from "../ports";

/**
 * Size of each chunk the Reader Agent reads. About 12,000 characters are ~3,000 tokens;
 * adding instructions, schema and answer, each request stays around ~5,000 tokens,
 * below Groq's limit of 8,000 tokens per minute.
 */
const MAX_CHUNK_CHARACTERS = 12_000;

/** A long scientific article has ~150,000 characters; anything beyond this is not an article. */
export const MAX_DOCUMENT_CHARACTERS = 400_000;

/** Below this the PDF has almost no text (for example, it is a scanned image). */
const MIN_TEXT_CHARACTERS = 500;

/** Spanish title shown in /upload when the file has none. */
const UNTITLED = "Documento sin título";

export type RegistrationResult =
  | { kind: "created"; document: SourceDocument }
  | { kind: "existing"; document: SourceDocument }
  | { kind: "no-text" };

export async function registerDocument(
  input: { title: string; text: string },
  documents: DocumentRepository,
): Promise<RegistrationResult> {
  const text = cleanText(input.text);
  if (text.length < MIN_TEXT_CHARACTERS) return { kind: "no-text" };

  const { document, created } = await documents.register({
    title: input.title.trim() || UNTITLED,
    fingerprint: textFingerprint(text),
    chunks: chunkText(text, MAX_CHUNK_CHARACTERS),
  });
  return { kind: created ? "created" : "existing", document };
}
