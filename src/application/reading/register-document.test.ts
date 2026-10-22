import { InMemoryDocumentRepository } from "@/infrastructure/in-memory/in-memory-document-repository";
import { sampleNotes } from "@/testing/factories";
import { registerDocument } from "./register-document";

const paragraph = "Las células del cuerpo se renuevan de forma ordenada. ".repeat(30);

describe("registerDocument", () => {
  let documents: InMemoryDocumentRepository;

  beforeEach(() => {
    documents = new InMemoryDocumentRepository();
  });

  it("stores the cleaned text in chunks that fit in one request to the Reader", async () => {
    const text = Array.from({ length: 20 }, () => paragraph).join("\n\n");

    const result = await registerDocument({ title: " Estudio.pdf ", text }, documents);

    expect(result).toMatchObject({ kind: "created", document: { title: "Estudio.pdf", status: "pending" } });
    const id = result.kind === "created" ? result.document.id : "";
    let chunks = 0;
    for (let c = await documents.nextPendingChunk(id); c; c = await documents.nextPendingChunk(id)) {
      expect(c.text.length).toBeLessThanOrEqual(12_000);
      await documents.saveNotes(id, c.position, sampleNotes());
      chunks += 1;
    }
    expect(chunks).toBeGreaterThan(1);
  });

  it("recognizes the same article even if the name and spacing change", async () => {
    await registerDocument({ title: "a.pdf", text: paragraph }, documents);

    const result = await registerDocument({ title: "b.pdf", text: `  ${paragraph}\n\n` }, documents);

    expect(result).toMatchObject({ kind: "existing", document: { title: "a.pdf" } });
  });

  it("rejects a PDF without enough text (for example, a scanned one)", async () => {
    expect(await registerDocument({ title: "x.pdf", text: "Página 1\n\n" }, documents)).toEqual({ kind: "no-text" });
    expect(await documents.list()).toEqual([]);
  });

  it("uses a default title when none is given", async () => {
    const result = await registerDocument({ title: "  ", text: paragraph }, documents);

    expect(result).toMatchObject({ document: { title: "Documento sin título" } });
  });
});
