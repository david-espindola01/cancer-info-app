import type { NuevaPagina, RepositorioPaginas } from "@/aplicacion/puertos";

const paginaDePrueba = (cambios: Partial<NuevaPagina> = {}): NuevaPagina => ({
  slug: "tumor",
  tema: "tumor",
  ui: '{"ui":[]}',
  fuentes: [{ numero: 1, titulo: "Estudio", referencia: "García (2024). Revista" }],
  palabrasClave: ["benigno", "maligno"],
  versionCorpus: 3,
  ...cambios,
});

/** Pruebas que toda implementación de RepositorioPaginas debe pasar. */
export function contratoRepositorioPaginas(crear: () => Promise<RepositorioPaginas>) {
  let repo: RepositorioPaginas;

  beforeEach(async () => {
    repo = await crear();
  });

  it("devuelve null para un tema que nunca se pidió", async () => {
    expect(await repo.obtener("nada")).toBeNull();
  });

  it("da el turno de generar a uno solo a la vez", async () => {
    expect(await repo.reservar("tumor", "tumor")).toBe(true);
    expect(await repo.reservar("tumor", "tumor")).toBe(false);

    expect(await repo.obtener("tumor")).toMatchObject({ slug: "tumor", estado: "generando", ui: null });
  });

  it("guarda la página generada y la deja lista", async () => {
    await repo.reservar("tumor", "tumor");

    await repo.guardar(paginaDePrueba());

    expect(await repo.obtener("tumor")).toEqual({ ...paginaDePrueba(), estado: "lista" });
  });

  it("al regenerar conserva la versión anterior para seguir sirviéndola", async () => {
    await repo.reservar("tumor", "tumor");
    await repo.guardar(paginaDePrueba());

    expect(await repo.reservar("tumor", "tumor")).toBe(true);

    expect(await repo.obtener("tumor")).toMatchObject({ estado: "generando", ui: '{"ui":[]}', versionCorpus: 3 });
  });

  it("cuenta solo las páginas que se pueden servir", async () => {
    await repo.reservar("tumor", "tumor");
    await repo.guardar(paginaDePrueba());
    await repo.reservar("dieta", "dieta");

    expect(await repo.contarListas()).toBe(1);
  });

  it("al liberar sin guardar marca el error, conserva lo anterior y permite reintentar", async () => {
    await repo.reservar("tumor", "tumor");
    await repo.guardar(paginaDePrueba());
    await repo.reservar("tumor", "tumor");

    await repo.liberar("tumor");

    expect(await repo.obtener("tumor")).toMatchObject({ estado: "error", ui: '{"ui":[]}' });
    expect(await repo.reservar("tumor", "tumor")).toBe(true);
  });
}
