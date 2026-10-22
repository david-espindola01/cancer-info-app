import { chunkText, cleanText, textFingerprint } from "./text";

describe("cleanText", () => {
  it("joins words split by a hyphen at the end of a line", () => {
    expect(cleanText("La quimio-\nterapia ayuda.")).toBe("La quimioterapia ayuda.");
  });

  it("keeps hyphens of uppercase compound words", () => {
    expect(cleanText("Estudio COVID-\n19 en adultos")).toBe("Estudio COVID- 19 en adultos");
  });

  it("joins the lines of a paragraph and separates paragraphs with a blank line", () => {
    const text = "Primera línea\ndel párrafo.\r\n\r\n\n  Segundo   párrafo. ";

    expect(cleanText(text)).toBe("Primera línea del párrafo.\n\nSegundo párrafo.");
  });

  it("removes repeated page headers and footers", () => {
    const page = (n: number) => `Revista de Oncología 2024\nContenido ${n}.\n\n`;
    const text = page(1) + page(2) + page(3);

    expect(cleanText(text)).toBe("Contenido 1.\n\nContenido 2.\n\nContenido 3.");
  });

  it("removes the bibliography when it is in the second half", () => {
    const body = "Resultados importantes del estudio. ".repeat(10);
    const text = `${body}\n\nReferences\n\n1. Autor A. Título. 2020.`;

    expect(cleanText(text)).toBe(body.trim());
  });

  it("does not cut a «Referencias» heading that appears at the start", () => {
    const text = `Referencias\n\n${"Texto del artículo. ".repeat(10)}`;

    expect(cleanText(text)).toContain("Texto del artículo.");
  });

  it("returns an empty string for text without content", () => {
    expect(cleanText(" \n\n ­ ")).toBe("");
  });
});

describe("chunkText", () => {
  it("groups paragraphs without exceeding the maximum", () => {
    const text = ["aaaa", "bbbb", "cccc"].join("\n\n");

    expect(chunkText(text, 10)).toEqual(["aaaa\n\nbbbb", "cccc"]);
  });

  it("splits a paragraph that exceeds the maximum by sentences", () => {
    expect(chunkText("Uno dos. Tres cuatro. Cinco.", 12)).toEqual(["Uno dos.", "Tres cuatro.", "Cinco."]);
  });

  it("cuts a sentence longer than the maximum by characters", () => {
    expect(chunkText("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
  });

  it("never produces a chunk longer than the maximum", () => {
    const text = Array.from({ length: 50 }, (_, i) => `Oración número ${i}. `.repeat((i % 7) + 1)).join("\n\n");

    const chunks = chunkText(text, 120);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length > 0 && chunk.length <= 120)).toBe(true);
  });

  it("returns an empty list for empty text", () => {
    expect(chunkText("", 100)).toEqual([]);
  });
});

describe("textFingerprint", () => {
  it("is equal for the same text and different for another", () => {
    expect(textFingerprint("abc")).toBe(textFingerprint("abc"));
    expect(textFingerprint("abc")).not.toBe(textFingerprint("abd"));
    expect(textFingerprint("abc")).toMatch(/^[0-9a-f]{64}$/);
  });
});
