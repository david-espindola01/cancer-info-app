import { sampleMemory } from "@/testing/factories";
import { prepareMaterial } from "./material";

const found = (title: string, changes = {}) => ({
  documentId: title,
  title: `${title}.pdf`,
  content: sampleMemory({ plainTitle: title, ...changes }),
});

describe("prepareMaterial", () => {
  it("numbers the memories as sources and builds their reference", () => {
    const { text, sources } = prepareMaterial([found("Estudio A"), found("Estudio B")]);

    expect(sources).toEqual([
      { number: 1, title: "Estudio A", reference: "García L (2024). Revista de Prueba" },
      { number: 2, title: "Estudio B", reference: "García L (2024). Revista de Prueba" },
    ]);
    expect(text).toContain("[1] Estudio A\nTopics covered: células\nMain idea: Las células se renuevan.");
    expect(text).toContain("[2] Estudio B");
    expect(text).toContain("Findings:\n- Las células se dividen. (evidence medium)");
    expect(text).toContain("Figures:\n- 1 de cada 3: Personas del estudio");
  });

  it("builds the reference only from known data, or uses the document title", () => {
    const noData = { authors: "", year: "", journal: "" };
    const partial = { authors: "García L", year: "", journal: "Revista X" };

    const { sources } = prepareMaterial([found("Sin datos", { reference: noData }), found("Parcial", { reference: partial })]);

    expect(sources.map((s) => s.reference)).toEqual(["Sin datos.pdf", "García L. Revista X"]);
  });

  it("caps each list and leaves out the empty ones", () => {
    const findings = Array.from({ length: 9 }, (_, i) => ({ text: `Hallazgo ${i}`, strength: "high" as const }));

    const { text } = prepareMaterial([found("A", { findings, limitations: [] })]);

    expect(text).toContain("Hallazgo 4");
    expect(text).not.toContain("Hallazgo 5");
    expect(text).not.toContain("Limitations:");
  });

  it("does not add sources that would exceed the budget, but always includes the first one", () => {
    const long = "palabra ".repeat(800);

    const { text, sources } = prepareMaterial([found("Larga", { plainSummary: long }), found("Otra", { plainSummary: long })]);

    expect(sources.map((s) => s.title)).toEqual(["Larga"]);
    expect(text.length).toBeLessThanOrEqual(5_000);
  });
});
