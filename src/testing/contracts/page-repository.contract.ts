import type { NewPage, PageRepository } from "@/application/ports";

const samplePage = (changes: Partial<NewPage> = {}): NewPage => ({
  slug: "tumor",
  topic: "tumor",
  ui: '{"ui":[]}',
  sources: [{ number: 1, title: "Estudio", reference: "García (2024). Revista" }],
  keywords: ["benigno", "maligno"],
  corpusVersion: 3,
  ...changes,
});

/** Tests every PageRepository implementation must pass. */
export function pageRepositoryContract(create: () => Promise<PageRepository>) {
  let repo: PageRepository;

  beforeEach(async () => {
    repo = await create();
  });

  it("returns null for a topic that was never requested", async () => {
    expect(await repo.get("nothing")).toBeNull();
  });

  it("gives the turn to generate to only one at a time", async () => {
    expect(await repo.reserve("tumor", "tumor")).toBe(true);
    expect(await repo.reserve("tumor", "tumor")).toBe(false);

    expect(await repo.get("tumor")).toMatchObject({ slug: "tumor", status: "generating", ui: null });
  });

  it("saves the generated page and leaves it ready", async () => {
    await repo.reserve("tumor", "tumor");

    await repo.save(samplePage());

    expect(await repo.get("tumor")).toEqual({ ...samplePage(), status: "ready" });
  });

  it("when regenerating, keeps the previous version to keep serving it", async () => {
    await repo.reserve("tumor", "tumor");
    await repo.save(samplePage());

    expect(await repo.reserve("tumor", "tumor")).toBe(true);

    expect(await repo.get("tumor")).toMatchObject({ status: "generating", ui: '{"ui":[]}', corpusVersion: 3 });
  });

  it("counts only the pages that can be served", async () => {
    await repo.reserve("tumor", "tumor");
    await repo.save(samplePage());
    await repo.reserve("dieta", "dieta");

    expect(await repo.countReady()).toBe(1);
  });

  it("lists the pages that can be served, by topic, up to the limit", async () => {
    for (const topic of ["tumor", "dieta", "celulas"]) {
      await repo.reserve(topic, topic);
      await repo.save(samplePage({ slug: topic, topic, ui: `{"ui":["${topic}"]}` }));
    }
    await repo.reserve("pendiente", "pendiente");

    expect(await repo.listReady(2)).toEqual([
      { slug: "celulas", ui: '{"ui":["celulas"]}' },
      { slug: "dieta", ui: '{"ui":["dieta"]}' },
    ]);
    expect((await repo.listReady(10)).map((page) => page.slug)).toEqual(["celulas", "dieta", "tumor"]);
  });

  it("releasing without saving marks the error, keeps the previous page and allows retrying", async () => {
    await repo.reserve("tumor", "tumor");
    await repo.save(samplePage());
    await repo.reserve("tumor", "tumor");

    await repo.release("tumor");

    expect(await repo.get("tumor")).toMatchObject({ status: "error", ui: '{"ui":[]}' });
    expect(await repo.reserve("tumor", "tumor")).toBe(true);
  });
}
