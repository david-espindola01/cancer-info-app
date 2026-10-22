import type { RepositorioDocumentos, RepositorioMemorias } from "@/aplicacion/puertos";
import { memoriaDePrueba, nuevoDocumento } from "../fabricas";

interface Repositorios {
  documentos: RepositorioDocumentos;
  memorias: RepositorioMemorias;
}

/** Pruebas que toda implementación de RepositorioMemorias debe pasar. */
export function contratoRepositorioMemorias(crear: () => Promise<Repositorios>) {
  let repos: Repositorios;

  beforeEach(async () => {
    repos = await crear();
  });

  async function documentoConMemoria(titulo: string, resumenSencillo: string) {
    const { documento } = await repos.documentos.registrar(nuevoDocumento({ titulo }));
    await repos.memorias.guardar(documento.id, memoriaDePrueba({ resumenSencillo, temas: [] }));
    return documento.id;
  }

  it("la versión del corpus empieza en 0 y sube con cada memoria guardada", async () => {
    expect(await repos.memorias.versionCorpus()).toBe(0);

    const id = await documentoConMemoria("A", "texto");
    expect(await repos.memorias.versionCorpus()).toBe(1);

    expect(await repos.memorias.guardar(id, memoriaDePrueba())).toBe(2);
  });

  it("guardar de nuevo reemplaza la memoria del documento", async () => {
    const id = await documentoConMemoria("A", "Habla de pulmones.");

    await repos.memorias.guardar(id, memoriaDePrueba({ resumenSencillo: "Habla de riñones." }));

    expect(await repos.memorias.buscar("pulmones", 5)).toEqual([]);
    expect(await repos.memorias.buscar("riñones", 5)).toMatchObject([{ documentoId: id, titulo: "A" }]);
  });

  it("encuentra palabras aunque la consulta no lleve tildes", async () => {
    const id = await documentoConMemoria("Piel", "El melanoma es un cáncer de piel.");

    const encontradas = await repos.memorias.buscar("cancer", 5);

    expect(encontradas).toHaveLength(1);
    expect(encontradas[0]).toMatchObject({ documentoId: id, titulo: "Piel" });
    expect(encontradas[0]?.contenido.resumenSencillo).toBe("El melanoma es un cáncer de piel.");
  });

  it("ordena por relevancia y respeta el límite", async () => {
    const ambos = await documentoConMemoria("Ambos", "Melanoma y radiación solar.");
    await documentoConMemoria("Uno", "Solo melanoma.");
    await documentoConMemoria("Ninguno", "Otro asunto.");

    const encontradas = await repos.memorias.buscar("melanoma radiación", 5);
    expect(encontradas.map((m) => m.titulo)).toEqual(["Ambos", "Uno"]);
    expect((await repos.memorias.buscar("melanoma radiación", 1)).map((m) => m.documentoId)).toEqual([ambos]);
  });

  it("lista los temas que más memorias cubren, del más al menos frecuente", async () => {
    for (const temas of [["tabaco", "pulmón"], ["tabaco", "dieta"], ["dieta", "tabaco", "sol"]]) {
      const { documento } = await repos.documentos.registrar(nuevoDocumento());
      await repos.memorias.guardar(documento.id, memoriaDePrueba({ temas }));
    }

    expect(await repos.memorias.temasMasFrecuentes(3)).toEqual(["tabaco", "dieta", "pulmón"]);
  });

  it("prioriza la fuente cuyo título se parece a la consulta, aunque otra mencione más la palabra", async () => {
    await documentoConMemoria("Factores de riesgo de cáncer", "El cáncer, el cáncer y el cáncer: riesgos del cáncer.");
    const definicion = await documentoConMemoria("¿Qué es el cáncer?", "Una definición del cáncer.");

    const [primera] = await repos.memorias.buscar("que es el cancer", 1);

    expect(primera?.documentoId).toBe(definicion);
  });

  it("devuelve vacío si la consulta no tiene palabras útiles", async () => {
    await documentoConMemoria("A", "texto");

    expect(await repos.memorias.buscar("¿? y o", 5)).toEqual([]);
  });
}
