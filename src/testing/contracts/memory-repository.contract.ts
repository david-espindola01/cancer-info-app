import type { DocumentRepository, MemoryRepository } from "@/application/ports";
import { newDocument, sampleMemory } from "../factories";

interface Repositories {
  documents: DocumentRepository;
  memories: MemoryRepository;
}

/** Tests every MemoryRepository implementation must pass. */
export function memoryRepositoryContract(create: () => Promise<Repositories>) {
  let repos: Repositories;

  beforeEach(async () => {
    repos = await create();
  });

  async function documentWithMemory(title: string, plainSummary: string) {
    const { document } = await repos.documents.register(newDocument({ title }));
    await repos.memories.save(document.id, sampleMemory({ plainSummary, topics: [] }));
    return document.id;
  }

  it("the corpus version starts at 0 and goes up with each saved memory", async () => {
    expect(await repos.memories.corpusVersion()).toBe(0);

    const id = await documentWithMemory("A", "texto");
    expect(await repos.memories.corpusVersion()).toBe(1);

    expect(await repos.memories.save(id, sampleMemory())).toBe(2);
  });

  it("saving again replaces the document's memory", async () => {
    const id = await documentWithMemory("A", "Habla de pulmones.");

    await repos.memories.save(id, sampleMemory({ plainSummary: "Habla de riñones." }));

    expect(await repos.memories.search("pulmones", 5)).toEqual([]);
    expect(await repos.memories.search("riñones", 5)).toMatchObject([{ documentId: id, title: "A" }]);
  });

  it("finds words even when the query has no accents", async () => {
    const id = await documentWithMemory("Piel", "El melanoma es un cáncer de piel.");

    const found = await repos.memories.search("cancer", 5);

    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ documentId: id, title: "Piel" });
    expect(found[0]?.content.plainSummary).toBe("El melanoma es un cáncer de piel.");
  });

  it("orders by relevance and respects the limit", async () => {
    const both = await documentWithMemory("Ambos", "Melanoma y radiación solar.");
    await documentWithMemory("Uno", "Solo melanoma.");
    await documentWithMemory("Ninguno", "Otro asunto.");

    const found = await repos.memories.search("melanoma radiación", 5);
    expect(found.map((m) => m.title)).toEqual(["Ambos", "Uno"]);
    expect((await repos.memories.search("melanoma radiación", 1)).map((m) => m.documentId)).toEqual([both]);
  });

  it("lists the topics most memories cover, from most to least common", async () => {
    for (const topics of [["tabaco", "pulmón"], ["tabaco", "dieta"], ["dieta", "tabaco", "sol"]]) {
      const { document } = await repos.documents.register(newDocument());
      await repos.memories.save(document.id, sampleMemory({ topics }));
    }

    expect(await repos.memories.mostCommonTopics(3)).toEqual(["tabaco", "dieta", "pulmón"]);
  });

  it("prefers the source whose title resembles the query, even if another mentions the word more", async () => {
    await documentWithMemory("Factores de riesgo de cáncer", "El cáncer, el cáncer y el cáncer: riesgos del cáncer.");
    const definition = await documentWithMemory("¿Qué es el cáncer?", "Una definición del cáncer.");

    const [first] = await repos.memories.search("que es el cancer", 1);

    expect(first?.documentId).toBe(definition);
  });

  it("returns nothing if the query has no useful words", async () => {
    await documentWithMemory("A", "texto");

    expect(await repos.memories.search("¿? y o", 5)).toEqual([]);
  });

  it("leaves out the memories of documents that are turned off or deleted", async () => {
    const off = await documentWithMemory("Apagado", "Melanoma y sol.");
    const gone = await documentWithMemory("Borrado", "Melanoma y piel.");
    const on = await documentWithMemory("Encendido", "Melanoma y control.");
    await repos.memories.save(off, sampleMemory({ plainSummary: "Melanoma y sol.", topics: ["sol"] }));
    await repos.memories.save(on, sampleMemory({ plainSummary: "Melanoma y control.", topics: ["control"] }));

    await repos.documents.setActive(off, false);
    await repos.documents.remove(gone);

    expect((await repos.memories.search("melanoma", 5)).map((m) => m.documentId)).toEqual([on]);
    expect(await repos.memories.mostCommonTopics(5)).toEqual(["control"]);

    await repos.documents.setActive(off, true);
    expect(await repos.memories.mostCommonTopics(5)).toEqual(["control", "sol"]);
  });

  it("bumps the corpus version when the knowledge changes in other ways", async () => {
    await documentWithMemory("A", "texto");

    expect(await repos.memories.corpusChanged()).toBe(2);
    expect(await repos.memories.corpusVersion()).toBe(2);
  });
}
