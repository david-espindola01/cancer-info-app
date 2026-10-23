import { InMemoryDocumentRepository } from "@/infrastructure/in-memory/in-memory-document-repository";
import { InMemoryMemoryRepository } from "@/infrastructure/in-memory/in-memory-memory-repository";
import { InMemoryPageRepository } from "@/infrastructure/in-memory/in-memory-page-repository";
import { FakeProvider } from "@/infrastructure/llm/fake-provider";
import { newDocument, sampleMemory } from "@/testing/factories";
import { RateLimitExceeded } from "../llm-errors";
import { generateTopicPage, getTopicPage, readyTopics, type VisitDependencies } from "./topic-pages";

const VALID_PAGE = {
  ui: [
    { Heading: { props: { title: "Tumor", subtitle: null } } },
    { Paragraph: { props: { text: "Un [[tumor]] puede ser [[benigno]]." } } },
    { Stat: { props: { value: "1 de 3", description: "d", source: 1 } } },
    { NextTopics: { props: { topics: [{ label: "Prevención", reason: "p" }] } } },
  ],
};

async function setUp(respond: ConstructorParameters<typeof FakeProvider>[0] = () => VALID_PAGE) {
  const documents = new InMemoryDocumentRepository();
  const memories = new InMemoryMemoryRepository(documents);
  const { document } = await documents.register(newDocument({ title: "Estudio" }));
  await memories.save(document.id, sampleMemory({ plainSummary: "Un tumor es una masa de células." }));
  const presenter = new FakeProvider(respond);
  const deps: VisitDependencies = {
    pages: new InMemoryPageRepository(),
    memories,
    presenter,
    allowGeneration: async () => true,
  };
  return { deps, presenter, memories, documentId: document.id };
}

describe("getTopicPage", () => {
  it("generates the page with the found sources, reviews it and stores it", async () => {
    const { deps, presenter } = await setUp();

    const result = await getTopicPage("Tumor", deps);

    expect(result).toMatchObject({ kind: "ready", stale: false });
    const page = result.kind === "ready" ? result.page : null;
    expect(page).toMatchObject({
      slug: "tumor",
      topic: "tumor",
      status: "ready",
      corpusVersion: 1,
      keywords: ["prevencion", "benigno"],
      sources: [{ number: 1, title: "Un estudio sobre células" }],
    });
    expect(JSON.parse(page!.ui).ui.map((n: object) => Object.keys(n)[0])).toEqual([
      "Heading",
      "Paragraph",
      "Stat",
      "Notice",
      "NextTopics",
      "Sources",
    ]);
    expect(presenter.requests[0]!.user).toContain("<topic>tumor</topic>");
    expect(presenter.requests[0]!.subject).toBe("page:tumor");
    expect(presenter.requests[0]!.user).toContain("[1] Un estudio sobre células");
    expect(await deps.pages.get("tumor")).toMatchObject({ status: "ready" });
  });

  it("serves the stored page without calling the AI again", async () => {
    const { deps, presenter } = await setUp();
    await getTopicPage("tumor", deps);

    const result = await getTopicPage("tumor", deps);

    expect(result).toMatchObject({ kind: "ready", stale: false });
    expect(presenter.requests).toHaveLength(1);
  });

  it("flags the page as stale when new knowledge arrived", async () => {
    const { deps, memories, documentId } = await setUp();
    await getTopicPage("tumor", deps);

    await memories.save(documentId, sampleMemory());

    expect(await getTopicPage("tumor", deps)).toMatchObject({ kind: "ready", stale: true });
  });

  it("without sources on the topic, stores without calling the AI a page that suggests covered topics", async () => {
    const { deps, presenter } = await setUp();

    const result = await getTopicPage("fútbol", deps);

    expect(result.kind === "ready" && JSON.parse(result.page.ui)).toMatchObject({
      ui: [
        { Heading: { props: { title: "Futbol" } } },
        { NoInformation: {} },
        { NextTopics: { props: { topics: [{ label: "células" }] } } },
      ],
    });
    expect(result.kind === "ready" && result.page.keywords).toEqual(["celulas"]);
    expect(presenter.requests).toHaveLength(0);
  });

  it("asks to check again when someone else is generating the same page", async () => {
    const { deps } = await setUp();
    await deps.pages.reserve("tumor", "tumor");

    expect(await getTopicPage("tumor", deps)).toEqual({ kind: "preparing", retryMs: 2_000, ahead: 0, waitMs: 2_000 });
  });

  it("on the AI's limit, releases the turn and asks to wait as indicated", async () => {
    const { deps } = await setUp(() => {
      throw new RateLimitExceeded(12_000, 3);
    });

    expect(await getTopicPage("tumor", deps)).toEqual({ kind: "preparing", retryMs: 12_000, ahead: 3, waitMs: 12_000 });
    expect(await deps.pages.get("tumor")).toMatchObject({ status: "error" });
  });

  it("if it cites a non-existent source, requests the page once more", async () => {
    let attempts = 0;
    const { deps, presenter } = await setUp(() => {
      attempts += 1;
      const source = attempts === 1 ? 7 : 1;
      return { ui: [{ Stat: { props: { value: "1", description: "d", source } } }] };
    });

    expect(await getTopicPage("tumor", deps)).toMatchObject({ kind: "ready" });
    expect(presenter.requests).toHaveLength(2);
  });

  it("if it fails again, reports the error without storing anything", async () => {
    const { deps, presenter } = await setUp(() => ({ ui: [{ Sources: { props: { numbers: [7] } } }] }));

    expect(await getTopicPage("tumor", deps)).toEqual({ kind: "error" });
    expect(presenter.requests).toHaveLength(2);
    expect(await deps.pages.get("tumor")).toMatchObject({ status: "error", ui: null });
  });

  it("asks again within 30 s at most, even if the AI says to wait longer", async () => {
    const { deps } = await setUp(() => {
      throw new RateLimitExceeded(1_470_000);
    });

    expect(await getTopicPage("tumor", deps)).toEqual({ kind: "preparing", retryMs: 30_000, ahead: 0, waitMs: 1_470_000 });
  });

  it("releases the turn and propagates unexpected errors", async () => {
    const { deps } = await setUp(() => {
      throw new Error("network down");
    });

    await expect(getTopicPage("tumor", deps)).rejects.toThrow("network down");
    expect(await deps.pages.reserve("tumor", "tumor")).toBe(true);
  });

  it("when the visitor reached their limit of new pages, does not generate but still serves stored ones", async () => {
    const { deps, presenter } = await setUp();
    await getTopicPage("tumor", deps);
    const notAllowed = { ...deps, allowGeneration: async () => false };

    expect(await getTopicPage("dieta", notAllowed)).toEqual({ kind: "limit" });
    expect(await getTopicPage("tumor", notAllowed)).toMatchObject({ kind: "ready" });
    expect(presenter.requests).toHaveLength(1);
  });

  it("does not count again a page that is already on its way, however many times it is asked for", async () => {
    let calls = 0;
    const { deps } = await setUp(() => {
      calls += 1;
      if (calls === 1) throw new RateLimitExceeded(30_000);
      return VALID_PAGE;
    });
    const allowGeneration = vi.fn(async () => true);
    const visit = { ...deps, allowGeneration };

    expect(await getTopicPage("tumor", visit)).toMatchObject({ kind: "preparing" });
    expect(await getTopicPage("tumor", visit)).toMatchObject({ kind: "ready" });
    expect(allowGeneration).toHaveBeenCalledTimes(1);
  });

  it("rejects a topic without letters or digits", async () => {
    const { deps } = await setUp();

    expect(await getTopicPage("¿?", deps)).toEqual({ kind: "invalid" });
  });
});

describe("generateTopicPage", () => {
  it("does not regenerate when someone else holds the turn", async () => {
    const { deps, presenter } = await setUp();
    await deps.pages.reserve("tumor", "tumor");

    expect(await generateTopicPage("tumor", deps)).toEqual({ kind: "busy" });
    expect(presenter.requests).toHaveLength(0);
  });
});

describe("readyTopics", () => {
  async function stored(...pages: { slug: string; ui: unknown[] }[]) {
    const repo = new InMemoryPageRepository();
    for (const page of pages) {
      await repo.reserve(page.slug, page.slug);
      await repo.save({ slug: page.slug, topic: page.slug, ui: JSON.stringify({ ui: page.ui }), sources: [], keywords: [], corpusVersion: 1 });
    }
    return repo;
  }

  it("lists the ready topics by title, leaving out the ones without information", async () => {
    const repo = await stored(
      { slug: "tumor", ui: [{ Heading: { props: { title: "¿Qué es un tumor?" } } }] },
      { slug: "dolor-de-espalda", ui: [{ Heading: { props: { title: "Dolor" } } }, { NoInformation: { props: {} } }] },
      { slug: "celulas-madre", ui: [{ Paragraph: { props: { text: "Sin título" } } }] },
      { slug: "ejercicio", ui: [{ Heading: { props: { title: "Actividad física" } } }] },
    );

    expect(await readyTopics(repo)).toEqual([
      { slug: "ejercicio", title: "Actividad física" },
      { slug: "celulas-madre", title: "celulas madre" },
      { slug: "tumor", title: "¿Qué es un tumor?" },
    ]);
  });
});
