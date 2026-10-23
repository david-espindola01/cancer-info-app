import { hasInformation, pageTitle } from "./page";

const page = (...ui: unknown[]) => JSON.stringify({ ui });

describe("pageTitle", () => {
  it("is the Heading's title, without keyword marks", () => {
    expect(pageTitle(page({ Heading: { props: { title: " ¿Qué es la [[metástasis|metástasis]]? " } } }))).toBe(
      "¿Qué es la metástasis?",
    );
  });

  it("looks for the first Heading with a title", () => {
    const ui = page({ Paragraph: { props: { text: "Hola" } } }, { Heading: { props: { title: "  " } } }, {
      Heading: { props: { title: "Prevención" } },
    });

    expect(pageTitle(ui)).toBe("Prevención");
  });

  it.each([
    ["has no Heading", page({ Paragraph: { props: { text: "Hola" } } })],
    ["is not JSON", "no es json"],
    ["has no ui list", JSON.stringify({ ui: "texto" })],
    ["is null", "null"],
    ["has empty nodes", page(null)],
  ])("is null if the page %s", (_, ui) => {
    expect(pageTitle(ui)).toBeNull();
  });
});

describe("hasInformation", () => {
  it("is true for a page with content", () => {
    expect(hasInformation(page({ Heading: { props: { title: "Tumor" } } }, null))).toBe(true);
  });

  it("is false for a page that says there is no information, or an empty one", () => {
    expect(hasInformation(page({ Heading: { props: { title: "X" } } }, { NoInformation: { props: {} } }))).toBe(false);
    expect(hasInformation(page())).toBe(false);
    expect(hasInformation("roto")).toBe(false);
  });
});
