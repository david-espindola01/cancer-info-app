import { randomUUID } from "node:crypto";
import type { RepositorioDocumentos } from "@/aplicacion/puertos";
import { nuevoDocumento } from "../fabricas";

/** Pruebas que toda implementación de RepositorioDocumentos debe pasar. */
export function contratoRepositorioDocumentos(crear: () => Promise<RepositorioDocumentos>) {
  let repo: RepositorioDocumentos;

  beforeEach(async () => {
    repo = await crear();
  });

  it("registra un documento pendiente con sus fragmentos", async () => {
    const { documento, creado } = await repo.registrar(nuevoDocumento({ titulo: "Estudio A" }));

    expect(creado).toBe(true);
    expect(documento).toMatchObject({ titulo: "Estudio A", estado: "pendiente", error: null });
    expect(await repo.obtener(documento.id)).toEqual(documento);
  });

  it("no duplica un documento con la misma huella", async () => {
    const datos = nuevoDocumento();
    const primero = await repo.registrar(datos);

    const segundo = await repo.registrar({ ...datos, titulo: "Otro nombre de archivo" });

    expect(segundo).toEqual({ documento: primero.documento, creado: false });
    expect(await repo.listar()).toHaveLength(1);
  });

  it("devuelve null para un documento que no existe", async () => {
    expect(await repo.obtener(randomUUID())).toBeNull();
  });

  it("lista del más reciente al más antiguo", async () => {
    const a = await repo.registrar(nuevoDocumento());
    const b = await repo.registrar(nuevoDocumento());

    expect((await repo.listar()).map((d) => d.id)).toEqual([b.documento.id, a.documento.id]);
  });

  it("cambia el estado y guarda o limpia el error", async () => {
    const { documento } = await repo.registrar(nuevoDocumento());

    await repo.cambiarEstado(documento.id, "error", "Sin texto");
    expect(await repo.obtener(documento.id)).toMatchObject({ estado: "error", error: "Sin texto" });

    await repo.cambiarEstado(documento.id, "listo");
    expect(await repo.obtener(documento.id)).toMatchObject({ estado: "listo", error: null });
  });

  it("entrega los fragmentos pendientes en orden y acumula sus notas", async () => {
    const { documento } = await repo.registrar(nuevoDocumento({ fragmentos: ["uno", "dos"] }));
    const notas = { hallazgos: ["h"], cifras: [], conceptos: [], limitaciones: [] };

    expect(await repo.siguienteFragmentoPendiente(documento.id)).toEqual({
      documentoId: documento.id,
      orden: 0,
      texto: "uno",
    });
    await repo.guardarNotas(documento.id, 0, notas);
    expect(await repo.siguienteFragmentoPendiente(documento.id)).toMatchObject({ orden: 1, texto: "dos" });

    await repo.guardarNotas(documento.id, 1, { ...notas, hallazgos: ["h2"] });
    expect(await repo.siguienteFragmentoPendiente(documento.id)).toBeNull();
    expect((await repo.listarNotas(documento.id)).map((n) => n.hallazgos)).toEqual([["h"], ["h2"]]);
  });
}
