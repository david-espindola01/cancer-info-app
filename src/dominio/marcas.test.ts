import { marcarPrimeraAparicion, segmentarMarcas } from "./marcas";

describe("marcarPrimeraAparicion", () => {
  it("marca solo la primera aparición, como palabra completa y sin importar mayúsculas", () => {
    expect(marcarPrimeraAparicion("El Ejercicio diario. Más ejercicio.", "ejercicio")).toBe(
      "El [[Ejercicio]] diario. Más ejercicio.",
    );
  });

  it("no marca dentro de otra palabra ni dentro de una marca existente", () => {
    expect(marcarPrimeraAparicion("Los ejercicios y el [[ejercicio]]", "ejercicio")).toBeNull();
  });

  it("conserva las marcas existentes con su tema", () => {
    expect(marcarPrimeraAparicion("Ver [[tumores|tumor]] y la dieta", "dieta")).toBe(
      "Ver [[tumores|tumor]] y la [[dieta]]",
    );
  });

  it("encuentra expresiones de varias palabras y respeta los signos alrededor", () => {
    expect(marcarPrimeraAparicion("Sobre el cáncer de colon.", "cáncer de colon")).toBe("Sobre el [[cáncer de colon]].");
    expect(marcarPrimeraAparicion("Factores (riesgo)", "factores")).toBe("[[Factores]] (riesgo)");
  });

  it("devuelve null si el tema no aparece o no tiene letras", () => {
    expect(marcarPrimeraAparicion("Nada que ver", "tumor")).toBeNull();
    expect(marcarPrimeraAparicion("¿?", "¿?")).toBeNull();
  });
});

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
