import { contratoRepositorioDocumentos } from "@/pruebas/contratos/repositorio-documentos.contrato";
import { contratoRepositorioMemorias } from "@/pruebas/contratos/repositorio-memorias.contrato";
import { RepositorioDocumentosMemoria } from "./repositorio-documentos-memoria";
import { RepositorioMemoriasMemoria } from "./repositorio-memorias-memoria";

describe("RepositorioDocumentosMemoria", () => {
  contratoRepositorioDocumentos(async () => new RepositorioDocumentosMemoria());
});

describe("RepositorioMemoriasMemoria", () => {
  contratoRepositorioMemorias(async () => {
    const documentos = new RepositorioDocumentosMemoria();
    return { documentos, memorias: new RepositorioMemoriasMemoria(documentos) };
  });
});
