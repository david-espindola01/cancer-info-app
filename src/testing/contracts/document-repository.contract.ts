import { randomUUID } from "node:crypto";
import type { DocumentRepository } from "@/application/ports";
import { newDocument, sampleNotes } from "../factories";

/** Tests every DocumentRepository implementation must pass. */
export function documentRepositoryContract(create: () => Promise<DocumentRepository>) {
  let repo: DocumentRepository;

  beforeEach(async () => {
    repo = await create();
  });

  it("registers a pending document with its chunks", async () => {
    const { document, created } = await repo.register(newDocument({ title: "Estudio A" }));

    expect(created).toBe(true);
    expect(document).toMatchObject({ title: "Estudio A", status: "pending", error: null });
    expect(await repo.get(document.id)).toEqual(document);
  });

  it("does not duplicate a document with the same fingerprint", async () => {
    const data = newDocument();
    const first = await repo.register(data);

    const second = await repo.register({ ...data, title: "Another file name" });

    expect(second).toEqual({ document: first.document, created: false });
    expect(await repo.list()).toHaveLength(1);
  });

  it("returns null for a document that does not exist", async () => {
    expect(await repo.get(randomUUID())).toBeNull();
  });

  it("lists from newest to oldest", async () => {
    const a = await repo.register(newDocument());
    const b = await repo.register(newDocument());

    expect((await repo.list()).map((d) => d.id)).toEqual([b.document.id, a.document.id]);
  });

  it("changes the status and stores or clears the error", async () => {
    const { document } = await repo.register(newDocument());

    await repo.setStatus(document.id, "error", "No text");
    expect(await repo.get(document.id)).toMatchObject({ status: "error", error: "No text" });

    await repo.setStatus(document.id, "ready");
    expect(await repo.get(document.id)).toMatchObject({ status: "ready", error: null });
  });

  it("hands out pending chunks in order and accumulates their notes", async () => {
    const { document } = await repo.register(newDocument({ chunks: ["uno", "dos"] }));
    const notes = sampleNotes({ findings: ["h"] });

    expect(await repo.progress(document.id)).toEqual({ processed: 0, total: 2 });
    expect(await repo.nextPendingChunk(document.id)).toEqual({ documentId: document.id, position: 0, text: "uno" });
    await repo.saveNotes(document.id, 0, notes);
    expect(await repo.nextPendingChunk(document.id)).toMatchObject({ position: 1, text: "dos" });
    expect(await repo.progress(document.id)).toEqual({ processed: 1, total: 2 });

    await repo.saveNotes(document.id, 1, { ...notes, findings: ["h2"] });
    expect(await repo.nextPendingChunk(document.id)).toBeNull();
    expect((await repo.listNotes(document.id)).map((n) => n.findings)).toEqual([["h"], ["h2"]]);
  });

  it("the progress of a document without chunks is 0 of 0", async () => {
    const { document } = await repo.register(newDocument({ chunks: [] }));

    expect(await repo.progress(document.id)).toEqual({ processed: 0, total: 0 });
  });
}
