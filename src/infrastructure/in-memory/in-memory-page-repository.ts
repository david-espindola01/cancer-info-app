import type { NewPage, PageRepository } from "@/application/ports";
import type { TopicPage } from "@/domain/page";

const ABANDONED_TURN_MS = 2 * 60 * 1000;

/** In-memory implementation for tests (same contract as the Postgres one). */
export class InMemoryPageRepository implements PageRepository {
  private readonly pages = new Map<string, TopicPage>();
  /** When each page's status last changed. */
  private readonly changes = new Map<string, number>();

  constructor(private readonly now: () => number = Date.now) {}

  async get(slug: string) {
    const page = this.pages.get(slug);
    return page
      ? { ...page, sources: [...page.sources], documentIds: page.documentIds && [...page.documentIds], keywords: [...page.keywords] }
      : null;
  }

  async reserve(slug: string, topic: string) {
    const current = this.pages.get(slug);
    const since = this.changes.get(slug) ?? 0;
    if (current?.status === "generating" && this.now() - since < ABANDONED_TURN_MS) return false;

    const base = current ?? { slug, topic, ui: null, sources: [], documentIds: null, keywords: [], corpusVersion: -1 };
    this.update({ ...base, status: "generating" });
    return true;
  }

  async save(page: NewPage) {
    this.update({ ...page, status: "ready" });
  }

  async forgetDocument(documentId: string) {
    for (const page of [...this.pages.values()]) {
      const builtFromIt = page.documentIds === null || page.documentIds.includes(documentId);
      if (page.status !== "generating" && builtFromIt) this.pages.delete(page.slug);
    }
  }

  async countReady() {
    return [...this.pages.values()].filter((page) => page.ui !== null).length;
  }

  async listReady(limit: number) {
    return [...this.pages.values()]
      .filter((page): page is TopicPage & { ui: string } => page.ui !== null)
      .sort((a, b) => a.topic.localeCompare(b.topic))
      .slice(0, limit)
      .map(({ slug, ui }) => ({ slug, ui }));
  }

  async release(slug: string) {
    const current = this.pages.get(slug);
    if (current) this.update({ ...current, status: "error" });
  }

  private update(page: TopicPage) {
    this.pages.set(page.slug, page);
    this.changes.set(page.slug, this.now());
  }
}
