import { searchTerms } from "./search-terms";

describe("searchTerms", () => {
  it("keeps only useful words, lowercase and without repeats", () => {
    expect(searchTerms("¿Qué es el Cáncer de mama? cáncer")).toEqual(["qué", "cáncer", "mama"]);
  });

  it("removes tsquery operators so they cannot be injected", () => {
    expect(searchTerms("tumor & !(benigno) | 'x' <-> maligno:*")).toEqual(["tumor", "benigno", "maligno"]);
  });

  it("returns nothing if no word is left", () => {
    expect(searchTerms("de la y o")).toEqual([]);
  });
});
