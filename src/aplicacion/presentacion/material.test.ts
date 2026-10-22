import { memoriaDePrueba } from "@/pruebas/fabricas";
import { prepararMaterial } from "./material";

const encontrada = (titulo: string, cambios = {}) => ({
  documentoId: titulo,
  titulo: `${titulo}.pdf`,
  contenido: memoriaDePrueba({ tituloSencillo: titulo, ...cambios }),
});

describe("prepararMaterial", () => {
  it("numera las memorias como fuentes y arma su referencia", () => {
    const { texto, fuentes } = prepararMaterial([encontrada("Estudio A"), encontrada("Estudio B")]);

    expect(fuentes).toEqual([
      { numero: 1, titulo: "Estudio A", referencia: "García L (2024). Revista de Prueba" },
      { numero: 2, titulo: "Estudio B", referencia: "García L (2024). Revista de Prueba" },
    ]);
    expect(texto).toContain("[1] Estudio A\nTemas que cubre: células\nIdea central: Las células se renuevan.");
    expect(texto).toContain("[2] Estudio B");
    expect(texto).toContain("Hallazgos:\n- Las células se dividen. (evidencia media)");
    expect(texto).toContain("Cifras:\n- 1 de cada 3: Personas del estudio");
  });

  it("arma la referencia solo con los datos conocidos, o usa el título del documento", () => {
    const sinDatos = { autores: "No indicado", anio: "No indicado", revista: "No indicado" };
    const parcial = { autores: "García L", anio: "No indicado", revista: "Revista X" };

    const { fuentes } = prepararMaterial([
      encontrada("Sin datos", { referencia: sinDatos }),
      encontrada("Parcial", { referencia: parcial }),
    ]);

    expect(fuentes.map((f) => f.referencia)).toEqual(["Sin datos.pdf", "García L. Revista X"]);
  });

  it("limita cada lista y omite las que están vacías", () => {
    const hallazgos = Array.from({ length: 9 }, (_, i) => ({ texto: `Hallazgo ${i}`, solidez: "alta" as const }));

    const { texto } = prepararMaterial([encontrada("A", { hallazgos, limitaciones: [] })]);

    expect(texto).toContain("Hallazgo 4");
    expect(texto).not.toContain("Hallazgo 5");
    expect(texto).not.toContain("Limitaciones:");
  });

  it("no agrega fuentes que superarían el presupuesto, pero siempre incluye la primera", () => {
    const larga = "palabra ".repeat(800);

    const { texto, fuentes } = prepararMaterial([
      encontrada("Larga", { resumenSencillo: larga }),
      encontrada("Otra", { resumenSencillo: larga }),
    ]);

    expect(fuentes.map((f) => f.titulo)).toEqual(["Larga"]);
    expect(texto.length).toBeLessThanOrEqual(5_000);
  });
});
