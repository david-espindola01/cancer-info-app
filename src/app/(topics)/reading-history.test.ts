import { followTrail, MAX_TRAIL, rememberRead } from "./reading-history";

const topic = (slug: string) => ({ slug, title: slug.toUpperCase() });

describe("followTrail", () => {
  it("adds the opened topic at the end", () => {
    expect(followTrail([topic("a")], topic("b"))).toEqual([topic("a"), topic("b")]);
  });

  it("cuts the trail when the person goes back to a topic already in it", () => {
    expect(followTrail([topic("a"), topic("b"), topic("c")], topic("a"))).toEqual([topic("a")]);
  });

  it("updates the title of a topic it goes back to", () => {
    expect(followTrail([topic("a"), topic("b")], { slug: "b", title: "Nuevo" })).toEqual([
      topic("a"),
      { slug: "b", title: "Nuevo" },
    ]);
  });

  it(`keeps only the last ${MAX_TRAIL} steps`, () => {
    const long = ["a", "b", "c", "d"].map(topic);

    expect(followTrail(long, topic("e")).map((step) => step.slug)).toEqual(["b", "c", "d", "e"]);
  });
});

describe("rememberRead", () => {
  it("puts the most recent first without repeating it", () => {
    expect(rememberRead([topic("a"), topic("b")], topic("b"))).toEqual([topic("b"), topic("a")]);
  });

  it("keeps at most 60 topics", () => {
    const many = Array.from({ length: 60 }, (_, i) => topic(`t${i}`));

    const read = rememberRead(many, topic("nuevo"));
    expect(read).toHaveLength(60);
    expect(read[0]?.slug).toBe("nuevo");
    expect(read.at(-1)?.slug).toBe("t58");
  });
});
