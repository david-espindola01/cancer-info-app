import { markFirstOccurrence, splitMarks } from "./markup";

describe("markFirstOccurrence", () => {
  it("marks only the first occurrence, as a whole word and case-insensitively", () => {
    expect(markFirstOccurrence("El Ejercicio diario. Más ejercicio.", "ejercicio")).toBe(
      "El [[Ejercicio]] diario. Más ejercicio.",
    );
  });

  it("does not mark inside another word or inside an existing mark", () => {
    expect(markFirstOccurrence("Los ejercicios y el [[ejercicio]]", "ejercicio")).toBeNull();
  });

  it("keeps existing marks with their topic", () => {
    expect(markFirstOccurrence("Ver [[tumores|tumor]] y la dieta", "dieta")).toBe(
      "Ver [[tumores|tumor]] y la [[dieta]]",
    );
  });

  it("finds multi-word expressions and respects the punctuation around them", () => {
    expect(markFirstOccurrence("Sobre el cáncer de colon.", "cáncer de colon")).toBe("Sobre el [[cáncer de colon]].");
    expect(markFirstOccurrence("Factores (riesgo)", "factores")).toBe("[[Factores]] (riesgo)");
  });

  it("returns null when the topic does not appear or has no letters", () => {
    expect(markFirstOccurrence("Nada que ver", "tumor")).toBeNull();
    expect(markFirstOccurrence("¿?", "¿?")).toBeNull();
  });
});

describe("splitMarks", () => {
  it("turns marked words into linkable topics", () => {
    expect(splitMarks("Un [[tumor]] puede ser [[benigno]].")).toEqual([
      { kind: "text", text: "Un " },
      { kind: "topic", text: "tumor", slug: "tumor" },
      { kind: "text", text: " puede ser " },
      { kind: "topic", text: "benigno", slug: "benigno" },
      { kind: "text", text: "." },
    ]);
  });

  it("uses the target topic when given with «|»", () => {
    expect(splitMarks("Los [[tumores|tumor]] crecen")).toEqual([
      { kind: "text", text: "Los " },
      { kind: "topic", text: "tumores", slug: "tumor" },
      { kind: "text", text: " crecen" },
    ]);
  });

  it("normalizes the topic to an accent-free slug", () => {
    expect(splitMarks("[[Quimioterapia oral]]")).toEqual([
      { kind: "topic", text: "Quimioterapia oral", slug: "quimioterapia-oral" },
    ]);
  });

  it("keeps a mark without letters or digits as plain text", () => {
    expect(splitMarks("ver [[¿?]]")).toEqual([
      { kind: "text", text: "ver " },
      { kind: "text", text: "¿?" },
    ]);
  });

  it("leaves text without marks, or with unclosed marks, untouched", () => {
    expect(splitMarks("Sin marcas [[abierta")).toEqual([{ kind: "text", text: "Sin marcas [[abierta" }]);
    expect(splitMarks("")).toEqual([]);
  });
});
