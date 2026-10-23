import { randomUUID } from "node:crypto";
import { InMemoryDocumentRepository } from "@/infrastructure/in-memory/in-memory-document-repository";
import { InMemoryMemoryRepository } from "@/infrastructure/in-memory/in-memory-memory-repository";
import { InMemoryPageRepository } from "@/infrastructure/in-memory/in-memory-page-repository";
import { newDocument, sampleMemory } from "@/testing/factories";
import { removeDocument, setDocumentActive, type LibraryDependencies } from "./manage-documents";

async function setUp() {
  const documents = new InMemoryDocumentRepository();
  const deps: LibraryDependencies = {
    documents,
    memories: new InMemoryMemoryRepository(documents),
    pages: new InMemoryPageRepository(),
  };
  const { document } = await documents.register(newDocument());
  await deps.memories.save(document.id, sampleMemory({ plainSummary: "Las células se renuevan." }));
  await deps.pages.reserve("celulas", "celulas");
  await deps.pages.save({
    slug: "celulas",
    topic: "celulas",
    ui: '{"ui":[]}',
    sources: [],
    documentIds: [document.id],
    keywords: [],
    corpusVersion: 1,
  });
  return { deps, id: document.id };
}

/** The document's memory is no longer used, the page built from it is gone and the rest go stale. */
async function expectForgotten(deps: LibraryDependencies) {
  expect(await deps.memories.search("células", 5)).toEqual([]);
  expect(await deps.pages.get("celulas")).toBeNull();
  expect(await deps.memories.corpusVersion()).toBe(2);
}

describe("setDocumentActive", () => {
  it("turning a document off hides its memory and forgets the pages built from it at once", async () => {
    const { deps, id } = await setUp();

    expect(await setDocumentActive(id, false, deps)).toMatchObject({ id, active: false });

    await expectForgotten(deps);
  });

  it("turning it on again uses its memory and marks the other pages as stale", async () => {
    const { deps, id } = await setUp();
    await setDocumentActive(id, false, deps);

    await setDocumentActive(id, true, deps);

    expect(await deps.memories.search("células", 5)).toHaveLength(1);
    expect(await deps.memories.corpusVersion()).toBe(3);
  });

  it("returns null for a document that does not exist and changes nothing", async () => {
    const { deps } = await setUp();

    expect(await setDocumentActive(randomUUID(), false, deps)).toBeNull();
    expect(await deps.memories.corpusVersion()).toBe(1);
  });
});

describe("removeDocument", () => {
  it("deletes the document, its memory and the pages built from it", async () => {
    const { deps, id } = await setUp();

    expect(await removeDocument(id, deps)).toBe(true);

    expect(await deps.documents.get(id)).toBeNull();
    await expectForgotten(deps);
  });

  it("returns false for a document that does not exist", async () => {
    const { deps } = await setUp();

    expect(await removeDocument(randomUUID(), deps)).toBe(false);
    expect(await deps.memories.corpusVersion()).toBe(1);
  });
});
