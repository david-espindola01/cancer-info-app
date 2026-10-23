import type { SourceDocument } from "@/domain/document";
import type { DocumentRepository, MemoryRepository, PageRepository } from "../ports";

export interface LibraryDependencies {
  documents: DocumentRepository;
  memories: MemoryRepository;
  pages: PageRepository;
}

/**
 * Turns a document on or off for the agents. Turning it off forgets at once the pages built
 * from it, so nobody keeps reading what it said; in both cases the other pages are marked
 * stale and rebuilt on their next visit. Returns null if the document does not exist.
 */
export async function setDocumentActive(
  id: string,
  active: boolean,
  { documents, memories, pages }: LibraryDependencies,
): Promise<SourceDocument | null> {
  const document = await documents.setActive(id, active);
  if (!document) return null;
  if (!active) await pages.forgetDocument(id);
  await memories.corpusChanged();
  return document;
}

/** Deletes a document, what was read from it and the pages built from it. False if it did not exist. */
export async function removeDocument(id: string, { documents, memories, pages }: LibraryDependencies): Promise<boolean> {
  if (!(await documents.remove(id))) return false;
  await pages.forgetDocument(id);
  await memories.corpusChanged();
  return true;
}
