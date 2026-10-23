import type { JSONValue, Sql } from "postgres";
import type { NewPage, PageRepository } from "@/application/ports";
import type { PageSource, PageStatus, TopicPage } from "@/domain/page";

interface PageRow {
  slug: string;
  topic: string;
  ui: string | null;
  sources: PageSource[];
  document_ids: string[] | null;
  keywords: string[];
  corpus_version: number;
  status: PageStatus;
}

/** A page that was never generated has no corpus version yet. */
const NO_VERSION = -1;

export class PostgresPageRepository implements PageRepository {
  constructor(private readonly sql: Sql) {}

  async get(slug: string): Promise<TopicPage | null> {
    const [row] = await this.sql<PageRow[]>`select * from pages where slug = ${slug}`;
    if (!row) return null;
    return {
      slug: row.slug,
      topic: row.topic,
      ui: row.ui,
      sources: row.sources,
      documentIds: row.document_ids,
      keywords: row.keywords,
      corpusVersion: row.corpus_version,
      status: row.status,
    };
  }

  async reserve(slug: string, topic: string) {
    // A turn older than 2 minutes is considered abandoned (the function that took it died).
    const rows = await this.sql`
      insert into pages (slug, topic, corpus_version, status)
      values (${slug}, ${topic}, ${NO_VERSION}, 'generating')
      on conflict (slug) do update set status = 'generating', updated_at = now()
      where pages.status <> 'generating' or pages.updated_at < now() - interval '2 minutes'
      returning slug`;
    return rows.length > 0;
  }

  async save(page: NewPage) {
    await this.sql`
      update pages set
        topic = ${page.topic},
        ui = ${page.ui},
        sources = ${this.sql.json(page.sources as unknown as JSONValue)},
        document_ids = ${page.documentIds}::uuid[],
        keywords = ${page.keywords},
        corpus_version = ${page.corpusVersion},
        status = 'ready',
        updated_at = now()
      where slug = ${page.slug}`;
  }

  async forgetDocument(documentId: string) {
    await this.sql`
      delete from pages
      where status <> 'generating' and (document_ids is null or ${documentId}::uuid = any(document_ids))`;
  }

  async countReady() {
    const [row] = await this.sql<{ total: number }[]>`
      select count(*)::int as total from pages where ui is not null`;
    return row!.total;
  }

  async listReady(limit: number) {
    const rows = await this.sql<{ slug: string; ui: string }[]>`
      select slug, ui from pages where ui is not null order by topic limit ${limit}`;
    return rows.map(({ slug, ui }) => ({ slug, ui }));
  }

  async release(slug: string) {
    await this.sql`update pages set status = 'error', updated_at = now() where slug = ${slug}`;
  }
}
