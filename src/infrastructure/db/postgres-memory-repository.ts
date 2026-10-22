import type { Sql } from "postgres";
import type { FoundMemory, MemoryRepository } from "@/application/ports";
import type { MemoryContent } from "@/application/reading/schemas";
import { searchTerms } from "./search-terms";

export class PostgresMemoryRepository implements MemoryRepository {
  constructor(private readonly sql: Sql) {}

  save(documentId: string, content: MemoryContent) {
    return this.sql.begin(async (tx) => {
      await tx`
        insert into memories (document_id, content) values (${documentId}, ${tx.json(content)})
        on conflict (document_id)
        do update set content = excluded.content, updated_at = now()`;
      const [corpus] = await tx<{ version: number }[]>`
        update corpus set version = version + 1 returning version`;
      return corpus!.version;
    });
  }

  async search(query: string, limit: number): Promise<FoundMemory[]> {
    const terms = searchTerms(query);
    if (terms.length === 0) return [];

    const text = query.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    // One matching term is enough («|»). The order adds the text relevance (normalized to
    // 0–1) and, with double weight, how much the title resembles the query.
    const rows = await this.sql<{ document_id: string; title: string; content: MemoryContent }[]>`
      select m.document_id, d.title, m.content
      from memories m
      join documents d on d.id = m.document_id,
      to_tsquery('es', ${terms.join(" | ")}) query,
      lateral (
        select greatest(
          similarity(unaccent(lower(d.title)), ${text}),
          similarity(unaccent(lower(m.content->>'plainTitle')), ${text})
        ) as likeness
      ) title_match
      where m.search @@ query or title_match.likeness > 0.3
      order by title_match.likeness * 2 + ts_rank_cd(m.search, query, 32) desc, m.document_id
      limit ${limit}`;
    return rows.map((row) => ({ documentId: row.document_id, title: row.title, content: row.content }));
  }

  async mostCommonTopics(limit: number) {
    const rows = await this.sql<{ topic: string }[]>`
      select topic from memories, jsonb_array_elements_text(content->'topics') topic
      group by topic order by count(*) desc, topic limit ${limit}`;
    return rows.map((row) => row.topic);
  }

  async corpusVersion() {
    const [corpus] = await this.sql<{ version: number }[]>`select version from corpus`;
    return corpus!.version;
  }
}
