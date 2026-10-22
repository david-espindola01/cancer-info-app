import { FakeProvider } from "@/infrastructure/llm/fake-provider";
import { InMemoryDailyBudget } from "@/infrastructure/in-memory/in-memory-daily-budget";
import { InMemoryDocumentRepository } from "@/infrastructure/in-memory/in-memory-document-repository";
import { InMemoryMemoryRepository } from "@/infrastructure/in-memory/in-memory-memory-repository";
import { InMemoryPageRepository } from "@/infrastructure/in-memory/in-memory-page-repository";
import { newDocument, sampleMemory } from "@/testing/factories";
import { RateLimitExceeded } from "../llm-errors";
import { prefetchTopics } from "./prefetch-topics";
import { getTopicPage } from "./topic-pages";

const PAGE = { ui: [{ Paragraph: { props: { text: "Texto" } } }] };
const options = { perVisit: 2, dailyMax: 10 };

async function setUp(respond: ConstructorParameters<typeof FakeProvider>[0] = () => PAGE) {
  const documents = new InMemoryDocumentRepository();
  const memories = new InMemoryMemoryRepository(documents);
  const { document } = await documents.register(newDocument());
  await memories.save(
    document.id,
    sampleMemory({ plainSummary: "Tabaco, dieta, ejercicio, sol y alcohol se estudiaron." }),
  );
  const presenter = new FakeProvider(respond);
  const deps = {
    pages: new InMemoryPageRepository(),
    memories,
    presenter,
    budget: new InMemoryDailyBudget(),
    allowGeneration: async () => true,
  };
  return { deps, presenter, memories, documentId: document.id };
}

describe("prefetchTopics", () => {
  it("prepares the first pages in order, up to the per-visit maximum", async () => {
    const { deps } = await setUp();

    expect(await prefetchTopics(["tabaco", "dieta", "ejercicio"], deps, options)).toBe(2);

    expect(await deps.pages.get("tabaco")).toMatchObject({ status: "ready" });
    expect(await deps.pages.get("dieta")).toMatchObject({ status: "ready" });
    expect(await deps.pages.get("ejercicio")).toBeNull();
  });

  it("skips pages that are up to date or that someone else is generating", async () => {
    const { deps, presenter } = await setUp();
    await getTopicPage("tabaco", deps);
    await deps.pages.reserve("dieta", "dieta");

    expect(await prefetchTopics(["tabaco", "dieta", "ejercicio"], deps, options)).toBe(1);

    expect(presenter.requests.map((r) => r.user.match(/<topic>(.*)<\/topic>/)?.[1])).toEqual(["tabaco", "ejercicio"]);
  });

  it("prepares again a page that went stale", async () => {
    const { deps, memories, documentId } = await setUp();
    await getTopicPage("tabaco", deps);
    await memories.save(documentId, sampleMemory({ plainSummary: "Tabaco otra vez." }));

    expect(await prefetchTopics(["tabaco"], deps, options)).toBe(1);
    expect(await deps.pages.get("tabaco")).toMatchObject({ corpusVersion: 2 });
  });

  it("stops when the day's budget runs out", async () => {
    const { deps } = await setUp();

    expect(await prefetchTopics(["tabaco", "dieta"], deps, { perVisit: 5, dailyMax: 1 })).toBe(1);
    expect(await prefetchTopics(["sol"], deps, { perVisit: 5, dailyMax: 1 })).toBe(0);
    expect(await deps.pages.get("sol")).toBeNull();
  });

  it("if the AI asks for a short wait, waits and retries the same topic", async () => {
    let calls = 0;
    const { deps, presenter } = await setUp(() => {
      calls += 1;
      if (calls === 1) throw new RateLimitExceeded(12_000);
      return PAGE;
    });
    const wait = vi.fn(async () => {});

    expect(await prefetchTopics(["tabaco"], deps, options, wait)).toBe(1);
    expect(wait).toHaveBeenCalledWith(12_000);
    expect(presenter.requests).toHaveLength(2);
  });

  it("stops if the AI stays at its limit or asks to wait too long", async () => {
    const alwaysLimited = (ms: number) => () => {
      throw new RateLimitExceeded(ms);
    };
    const wait = vi.fn(async () => {});

    const short = await setUp(alwaysLimited(5_000));
    expect(await prefetchTopics(["tabaco", "dieta"], short.deps, options, wait)).toBe(0);
    expect(short.presenter.requests).toHaveLength(2);

    const long = await setUp(alwaysLimited(60_000));
    expect(await prefetchTopics(["tabaco", "dieta"], long.deps, options, wait)).toBe(0);
    expect(long.presenter.requests).toHaveLength(1);
    expect(wait).toHaveBeenCalledTimes(1);
  });

  it("by default really waits before retrying", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const { deps } = await setUp(() => {
      calls += 1;
      if (calls === 1) throw new RateLimitExceeded(1_000);
      return PAGE;
    });

    const prefetch = prefetchTopics(["tabaco"], deps, options);
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(prefetch).resolves.toBe(1);
    vi.useRealTimers();
  });

  it("does not count pages that could not be prepared", async () => {
    const { deps } = await setUp(() => ({ ui: [{ Sources: { props: { numbers: [9] } } }] }));

    expect(await prefetchTopics(["tabaco"], deps, options)).toBe(0);
  });
});
