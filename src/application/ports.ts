import type { Chunk, DocumentStatus, SourceDocument } from "@/domain/document";
import type { TopicPage } from "@/domain/page";
import type { TurnRequest } from "./ai-turns";
import type { ChunkNotes, MemoryContent } from "./reading/schemas";

export interface NewDocument {
  title: string;
  fingerprint: string;
  chunks: string[];
}

export interface DocumentRepository {
  /** Saves the document and its chunks. If the fingerprint already exists, returns the existing one. */
  register(document: NewDocument): Promise<{ document: SourceDocument; created: boolean }>;
  get(id: string): Promise<SourceDocument | null>;
  /** From newest to oldest. */
  list(): Promise<SourceDocument[]>;
  setStatus(id: string, status: DocumentStatus, error?: string): Promise<void>;
  /** The first chunk (by position) that has no notes yet. */
  nextPendingChunk(documentId: string): Promise<Chunk | null>;
  saveNotes(documentId: string, position: number, notes: ChunkNotes): Promise<void>;
  /** Notes of the chunks already processed, in order. */
  listNotes(documentId: string): Promise<ChunkNotes[]>;
  progress(documentId: string): Promise<{ processed: number; total: number }>;
}

export interface FoundMemory {
  documentId: string;
  title: string;
  content: MemoryContent;
}

export type NewPage = Omit<TopicPage, "status" | "ui"> & { ui: string };

export interface PageRepository {
  get(slug: string): Promise<TopicPage | null>;
  /**
   * Takes the turn to generate the page if nobody else holds it (or if whoever held it
   * has taken too long). Returns false if someone else is already generating it.
   * Keeps the previous version of the page so it can still be served meanwhile.
   */
  reserve(slug: string, topic: string): Promise<boolean>;
  /** Saves the generated page and releases the turn. */
  save(page: NewPage): Promise<void>;
  /** Releases the turn without saving (for example, if the AI hit its limit). */
  release(slug: string): Promise<void>;
  /** How many pages are ready to be served. */
  countReady(): Promise<number>;
  /** The pages ready to be served (slug and content), at most `limit`. */
  listReady(limit: number): Promise<{ slug: string; ui: string }[]>;
}

/** Request limit per key (for example, per visitor) within a time window. */
export interface RateLimiter {
  /** Counts a request if the maximum was not reached in the current window; otherwise returns false. */
  allow(key: string, max: number, windowSeconds: number): Promise<boolean>;
}

/** Daily AI usage per reason (resets every day): budget and accounting. */
export interface DailyBudget {
  /** Counts one use if there is budget left today; returns false once it is used up. */
  consume(reason: string, max: number): Promise<boolean>;
  /** Adds an amount to today's usage (for example, tokens spent), without a cap. */
  add(reason: string, amount: number): Promise<void>;
  /** Everything used today, by reason. */
  usageToday(): Promise<Record<string, number>>;
}

export interface MemoryRepository {
  /** Saves (or replaces) a document's memory and bumps the corpus version. Returns the new version. */
  save(documentId: string, content: MemoryContent): Promise<number>;
  /** Memories related to the query, from most to least relevant. */
  search(query: string, limit: number): Promise<FoundMemory[]>;
  /** The topics most memories cover (to suggest where to go next). */
  mostCommonTopics(limit: number): Promise<string[]>;
  corpusVersion(): Promise<number>;
}

/** The line to use each AI model (see ai-turns.ts), shared by every server instance. */
export interface AiCapacity {
  /**
   * Takes (or keeps) a place in line and, if it is this request's turn and its tokens fit,
   * reserves them. Waiting requests must ask again before 2 minutes or they lose their place.
   */
  requestTurn(
    request: TurnRequest,
  ): Promise<{ kind: "granted"; callId: string } | { kind: "wait"; waitMs: number; ahead: number }>;
  /** Replaces a call's reservation with the tokens it actually spent. */
  settle(callId: string, tokens: number): Promise<void>;
  /** The provider rejected the model's calls: nobody uses it for `waitMs`. */
  block(model: string, waitMs: number): Promise<void>;
}
