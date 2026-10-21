import { segmentarMarcas } from "./marcas";

describe("segmentarMarcas", () => {
  it("convierte las palabras marcadas en temas enlazables", () => {
    expect(segmentarMarcas("Un [[tumor]] puede ser [[benigno]].")).toEqual([
      { tipo: "texto", texto: "Un " },
      { tipo: "tema", texto: "tumor", slug: "tumor" },
      { tipo: "texto", texto: " puede ser " },
      { tipo: "tema", texto: "benigno", slug: "benigno" },
      { tipo: "texto", texto: "." },
    ]);
  });

  it("usa el tema destino cuando se indica con «|»", () => {
    expect(segmentarMarcas("Los [[tumores|tumor]] crecen")).toEqual([
      { tipo: "texto", texto: "Los " },
      { tipo: "tema", texto: "tumores", slug: "tumor" },
      { tipo: "texto", texto: " crecen" },
    ]);
  });

  it("normaliza el tema a un slug sin tildes", () => {
    expect(segmentarMarcas("[[Quimioterapia oral]]")).toEqual([
      { tipo: "tema", texto: "Quimioterapia oral", slug: "quimioterapia-oral" },
    ]);
  });

  it("deja como texto una marca sin letras ni números", () => {
    expect(segmentarMarcas("ver [[¿?]]")).toEqual([
      { tipo: "texto", texto: "ver " },
      { tipo: "texto", texto: "¿?" },
    ]);
  });

  it("no toca un texto sin marcas ni marcas mal cerradas", () => {
    expect(segmentarMarcas("Sin marcas [[abierta")).toEqual([{ tipo: "texto", texto: "Sin marcas [[abierta" }]);
    expect(segmentarMarcas("")).toEqual([]);
  });
});
