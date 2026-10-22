import type { Sql } from "postgres";
import type { ChunkNotes } from "@/application/reading/schemas";
import type { DocumentRepository, NewDocument } from "@/application/ports";
import type { Chunk, DocumentStatus, SourceDocument } from "@/domain/document";

interface DocumentRow {
  id: string;
  title: string;
  fingerprint: string;
  status: DocumentStatus;
  error: string | null;
  created_at: Date;
}

const toDocument = (row: DocumentRow): SourceDocument => ({
  id: row.id,
  title: row.title,
  fingerprint: row.fingerprint,
  status: row.status,
  error: row.error,
  createdAt: row.created_at,
});

export class PostgresDocumentRepository implements DocumentRepository {
  constructor(private readonly sql: Sql) {}

  register({ title, fingerprint, chunks }: NewDocument) {
    return this.sql.begin(async (tx) => {
      const [created] = await tx<DocumentRow[]>`
        insert into documents (title, fingerprint) values (${title}, ${fingerprint})
        on conflict (fingerprint) do nothing
        returning *`;
      if (!created) {
        const [existing] = await tx<DocumentRow[]>`select * from documents where fingerprint = ${fingerprint}`;
        return { document: toDocument(existing!), created: false };
      }
      if (chunks.length > 0) {
        const rows = chunks.map((text, position) => ({ document_id: created.id, position, text }));
        await tx`insert into chunks ${tx(rows)}`;
      }
      return { document: toDocument(created), created: true };
    });
  }

  async get(id: string) {
    const [row] = await this.sql<DocumentRow[]>`select * from documents where id = ${id}`;
    return row ? toDocument(row) : null;
  }

  async list() {
    const rows = await this.sql<DocumentRow[]>`select * from documents order by created_at desc, id`;
    return rows.map(toDocument);
  }

  async setStatus(id: string, status: DocumentStatus, error?: string) {
    await this.sql`
      update documents
      set status = ${status}, error = ${error ?? null}, updated_at = now()
      where id = ${id}`;
  }

  async nextPendingChunk(documentId: string): Promise<Chunk | null> {
    const [row] = await this.sql<{ position: number; text: string }[]>`
      select position, text from chunks
      where document_id = ${documentId} and notes is null
      order by position limit 1`;
    return row ? { documentId, position: row.position, text: row.text } : null;
  }

  async saveNotes(documentId: string, position: number, notes: ChunkNotes) {
    await this.sql`
      update chunks set notes = ${this.sql.json(notes)}
      where document_id = ${documentId} and position = ${position}`;
  }

  async listNotes(documentId: string) {
    const rows = await this.sql<{ notes: ChunkNotes }[]>`
      select notes from chunks
      where document_id = ${documentId} and notes is not null
      order by position`;
    return rows.map((row) => row.notes);
  }

  async progress(documentId: string) {
    const [row] = await this.sql<{ processed: number; total: number }[]>`
      select count(notes)::int as processed, count(*)::int as total
      from chunks where document_id = ${documentId}`;
    return { processed: row!.processed, total: row!.total };
  }
}
