import type { DocumentRepository, FoundMemory, MemoryRepository } from "@/application/ports";
import type { MemoryContent } from "@/application/reading/schemas";
import { searchTerms } from "../db/search-terms";

const withoutAccents = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * In-memory implementation for tests. Its search is simpler than Postgres' (exact words
 * without accents, no stems): the shared contract only requires that.
 */
export class InMemoryMemoryRepository implements MemoryRepository {
  private readonly memories = new Map<string, MemoryContent>();
  private version = 0;

  constructor(private readonly documents: DocumentRepository) {}

  async save(documentId: string, content: MemoryContent) {
    this.memories.set(documentId, content);
    this.version += 1;
    return this.version;
  }

  async search(query: string, limit: number) {
    const terms = searchTerms(query).map(withoutAccents);
    const found: { memory: FoundMemory; matches: number }[] = [];

    for (const [documentId, content] of await this.inUse()) {
      const wordsOf = (text: string) => new Set(withoutAccents(text).split(/[^\p{L}\p{N}]+/u));
      const words = wordsOf(textValues(content).join(" "));
      const title = (await this.documents.get(documentId))!.title;
      const inTitle = wordsOf(`${title} ${content.plainTitle}`);
      // As in Postgres: counts the match in the text and, with double weight, in the title.
      const matches =
        terms.filter((term) => words.has(term)).length + 2 * terms.filter((term) => inTitle.has(term)).length;
      if (matches === 0) continue;
      found.push({ memory: { documentId, title, content }, matches });
    }

    return found
      .sort((a, b) => b.matches - a.matches || a.memory.documentId.localeCompare(b.memory.documentId))
      .slice(0, limit)
      .map(({ memory }) => memory);
  }

  async mostCommonTopics(limit: number) {
    const counts = new Map<string, number>();
    for (const [, { topics }] of await this.inUse()) {
      for (const topic of topics) counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
    return [...counts]
      .sort(([a, n], [b, m]) => m - n || a.localeCompare(b))
      .slice(0, limit)
      .map(([topic]) => topic);
  }

  async corpusVersion() {
    return this.version;
  }

  async corpusChanged() {
    this.version += 1;
    return this.version;
  }

  /** Memories of documents that exist and are turned on (as the join in Postgres). */
  private async inUse() {
    const inUse: [string, MemoryContent][] = [];
    for (const [documentId, content] of this.memories) {
      if ((await this.documents.get(documentId))?.active) inUse.push([documentId, content]);
    }
    return inUse;
  }
}

function textValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(textValues);
  if (value && typeof value === "object") return Object.values(value).flatMap(textValues);
  return [];
}
