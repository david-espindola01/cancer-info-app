import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createUiJsonSchema } from "@hashbrownai/core";
import { infraccionesModoEstricto } from "@/infraestructura/llm/esquema-estricto";
import { catalogo } from "./contratos";

const PALABRAS_DE_UN_TEMA = /c[aá]ncer|tumor|oncol|quimio|met[aá]stasis|radioterapia/i;

function archivosFuente(directorio: string): string[] {
  return readdirSync(directorio, { withFileTypes: true, recursive: true })
    .filter((entrada) => entrada.isFile() && /\.tsx?$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name))
    .map((entrada) => join(entrada.parentPath, entrada.name));
}

describe("catálogo de interfaces", () => {
  it("su esquema cumple el modo estricto de Groq (contrato)", () => {
    expect(infraccionesModoEstricto(createUiJsonSchema({ components: catalogo }))).toEqual([]);
  });

  it("no repite nombres de componentes", () => {
    const nombres = catalogo.map((contrato) => contrato.name);

    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it("es genérico: ningún contrato ni componente se refiere a un tema concreto", () => {
    const conTema = ["src/ui", "src/ui-contratos"]
      .flatMap(archivosFuente)
      .filter((archivo) => PALABRAS_DE_UN_TEMA.test(readFileSync(archivo, "utf8")));

    expect(conTema).toEqual([]);
  });
});
