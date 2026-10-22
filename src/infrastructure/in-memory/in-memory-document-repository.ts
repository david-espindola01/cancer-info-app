import { randomUUID } from "node:crypto";
import type { DocumentRepository, NewDocument } from "@/application/ports";
import type { ChunkNotes } from "@/application/reading/schemas";
import type { Chunk, DocumentStatus, SourceDocument } from "@/domain/document";

interface StoredChunk extends Chunk {
  notes: ChunkNotes | null;
}

/** In-memory implementation for use-case tests (same contract as the Postgres one). */
export class InMemoryDocumentRepository implements DocumentRepository {
  private readonly documents: SourceDocument[] = [];
  private readonly chunks: StoredChunk[] = [];

  async register({ title, fingerprint, chunks }: NewDocument) {
    const existing = this.documents.find((document) => document.fingerprint === fingerprint);
    if (existing) return { document: { ...existing }, created: false };

    const document: SourceDocument = {
      id: randomUUID(),
      title,
      fingerprint,
      status: "pending",
      error: null,
      createdAt: new Date(),
    };
    this.documents.unshift(document);
    chunks.forEach((text, position) => this.chunks.push({ documentId: document.id, position, text, notes: null }));
    return { document: { ...document }, created: true };
  }

  async get(id: string) {
    const document = this.documents.find((d) => d.id === id);
    return document ? { ...document } : null;
  }

  async list() {
    return this.documents.map((document) => ({ ...document }));
  }

  async setStatus(id: string, status: DocumentStatus, error?: string) {
    const document = this.documents.find((d) => d.id === id);
    if (document) Object.assign(document, { status, error: error ?? null });
  }

  async nextPendingChunk(documentId: string) {
    const pending = this.chunksOf(documentId).find((chunk) => chunk.notes === null);
    return pending ? { documentId, position: pending.position, text: pending.text } : null;
  }

  async saveNotes(documentId: string, position: number, notes: ChunkNotes) {
    const chunk = this.chunksOf(documentId).find((c) => c.position === position);
    if (chunk) chunk.notes = notes;
  }

  async listNotes(documentId: string) {
    return this.chunksOf(documentId).flatMap((chunk) => (chunk.notes ? [chunk.notes] : []));
  }

  async progress(documentId: string) {
    const chunks = this.chunksOf(documentId);
    return { processed: chunks.filter((c) => c.notes !== null).length, total: chunks.length };
  }

  private chunksOf(documentId: string) {
    return this.chunks.filter((chunk) => chunk.documentId === documentId).sort((a, b) => a.position - b.position);
  }
}
