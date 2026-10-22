import { fragmentar, huellaTexto, limpiarTexto } from "./texto";

describe("limpiarTexto", () => {
  it("une palabras cortadas con guion al final de la línea", () => {
    expect(limpiarTexto("La quimio-\nterapia ayuda.")).toBe("La quimioterapia ayuda.");
  });

  it("conserva los guiones de palabras compuestas en mayúscula", () => {
    expect(limpiarTexto("Estudio COVID-\n19 en adultos")).toBe("Estudio COVID- 19 en adultos");
  });

  it("une las líneas de un párrafo y separa párrafos con una línea en blanco", () => {
    const texto = "Primera línea\ndel párrafo.\r\n\r\n\n  Segundo   párrafo. ";

    expect(limpiarTexto(texto)).toBe("Primera línea del párrafo.\n\nSegundo párrafo.");
  });

  it("quita encabezados y pies de página que se repiten", () => {
    const pagina = (n: number) => `Revista de Oncología 2024\nContenido ${n}.\n\n`;
    const texto = pagina(1) + pagina(2) + pagina(3);

    expect(limpiarTexto(texto)).toBe("Contenido 1.\n\nContenido 2.\n\nContenido 3.");
  });

  it("quita la bibliografía cuando está en la segunda mitad", () => {
    const cuerpo = "Resultados importantes del estudio. ".repeat(10);
    const texto = `${cuerpo}\n\nReferences\n\n1. Autor A. Título. 2020.`;

    expect(limpiarTexto(texto)).toBe(cuerpo.trim());
  });

  it("no corta un título «Referencias» que aparece al inicio", () => {
    const texto = `Referencias\n\n${"Texto del artículo. ".repeat(10)}`;

    expect(limpiarTexto(texto)).toContain("Texto del artículo.");
  });

  it("devuelve vacío para un texto sin contenido", () => {
    expect(limpiarTexto(" \n\n ­ ")).toBe("");
  });
});

describe("fragmentar", () => {
  it("agrupa párrafos sin superar el máximo", () => {
    const texto = ["aaaa", "bbbb", "cccc"].join("\n\n");

    expect(fragmentar(texto, 10)).toEqual(["aaaa\n\nbbbb", "cccc"]);
  });

  it("parte por oraciones un párrafo que supera el máximo", () => {
    expect(fragmentar("Uno dos. Tres cuatro. Cinco.", 12)).toEqual([
      "Uno dos.",
      "Tres cuatro.",
      "Cinco.",
    ]);
  });

  it("corta por caracteres una oración más larga que el máximo", () => {
    expect(fragmentar("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
  });

  it("ningún fragmento supera el máximo", () => {
    const texto = Array.from({ length: 50 }, (_, i) => `Oración número ${i}. `.repeat(i % 7 + 1)).join("\n\n");

    const fragmentos = fragmentar(texto, 120);

    expect(fragmentos.length).toBeGreaterThan(1);
    expect(fragmentos.every((f) => f.length > 0 && f.length <= 120)).toBe(true);
  });

  it("devuelve una lista vacía para un texto vacío", () => {
    expect(fragmentar("", 100)).toEqual([]);
  });
});

describe("huellaTexto", () => {
  it("es igual para el mismo texto y distinta para otro", () => {
    expect(huellaTexto("abc")).toBe(huellaTexto("abc"));
    expect(huellaTexto("abc")).not.toBe(huellaTexto("abd"));
    expect(huellaTexto("abc")).toMatch(/^[0-9a-f]{64}$/);
  });
});
