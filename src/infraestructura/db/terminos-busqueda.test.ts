import { terminosDeBusqueda } from "./terminos-busqueda";

describe("terminosDeBusqueda", () => {
  it("deja solo palabras útiles, en minúsculas y sin repetir", () => {
    expect(terminosDeBusqueda("¿Qué es el Cáncer de mama? cáncer")).toEqual(["qué", "cáncer", "mama"]);
  });

  it("elimina operadores de tsquery para que no se puedan inyectar", () => {
    expect(terminosDeBusqueda("tumor & !(benigno) | 'x' <-> maligno:*")).toEqual([
      "tumor",
      "benigno",
      "maligno",
    ]);
  });

  it("devuelve vacío si no queda ninguna palabra", () => {
    expect(terminosDeBusqueda("de la y o")).toEqual([]);
  });
});
