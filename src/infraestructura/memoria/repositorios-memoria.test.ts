import { contratoRepositorioDocumentos } from "@/pruebas/contratos/repositorio-documentos.contrato";
import { contratoRepositorioMemorias } from "@/pruebas/contratos/repositorio-memorias.contrato";
import { contratoRepositorioPaginas } from "@/pruebas/contratos/repositorio-paginas.contrato";
import { RepositorioDocumentosMemoria } from "./repositorio-documentos-memoria";
import { RepositorioMemoriasMemoria } from "./repositorio-memorias-memoria";
import { RepositorioPaginasMemoria } from "./repositorio-paginas-memoria";

describe("RepositorioDocumentosMemoria", () => {
  contratoRepositorioDocumentos(async () => new RepositorioDocumentosMemoria());
});

describe("RepositorioMemoriasMemoria", () => {
  contratoRepositorioMemorias(async () => {
    const documentos = new RepositorioDocumentosMemoria();
    return { documentos, memorias: new RepositorioMemoriasMemoria(documentos) };
  });
});

describe("RepositorioPaginasMemoria", () => {
  contratoRepositorioPaginas(async () => new RepositorioPaginasMemoria());

  it("considera abandonado un turno de más de 2 minutos", async () => {
    let ahora = 0;
    const repo = new RepositorioPaginasMemoria(() => ahora);
    await repo.reservar("tumor", "tumor");

    ahora = 2 * 60 * 1000 - 1;
    expect(await repo.reservar("tumor", "tumor")).toBe(false);
    ahora = 2 * 60 * 1000;
    expect(await repo.reservar("tumor", "tumor")).toBe(true);
  });

  it("liberar una página inexistente no hace nada", async () => {
    const repo = new RepositorioPaginasMemoria();

    await repo.liberar("nada");

    expect(await repo.obtener("nada")).toBeNull();
  });
});
