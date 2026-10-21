import { normalizarSlug } from "./slug";

describe("normalizarSlug", () => {
  it.each([
    ["¿Qué es el cáncer?", "que-es-el-cancer"],
    ["Niño y Pequeño", "nino-y-pequeno"],
    ["  Cáncer   de   mama  ", "cancer-de-mama"],
    ["VPH (virus del papiloma humano)", "vph-virus-del-papiloma-humano"],
    ["Tipo 2", "tipo-2"],
    ["¡¿?!", ""],
  ])("«%s» → «%s»", (entrada, esperado) => {
    expect(normalizarSlug(entrada)).toBe(esperado);
  });

  it("limita la longitud sin dejar un guion al final", () => {
    const slug = normalizarSlug(`${"palabra ".repeat(20)}final`);

    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});
