import { normalizeSlug } from "./slug";

describe("normalizeSlug", () => {
  it.each([
    ["¿Qué es el cáncer?", "que-es-el-cancer"],
    ["Niño y Pequeño", "nino-y-pequeno"],
    ["  Cáncer   de   mama  ", "cancer-de-mama"],
    ["VPH (virus del papiloma humano)", "vph-virus-del-papiloma-humano"],
    ["Tipo 2", "tipo-2"],
    ["¡¿?!", ""],
  ])("«%s» → «%s»", (input, expected) => {
    expect(normalizeSlug(input)).toBe(expected);
  });

  it("limits the length without leaving a trailing hyphen", () => {
    const slug = normalizeSlug(`${"palabra ".repeat(20)}final`);

    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});
