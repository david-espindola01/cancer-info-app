import { ProveedorFalso } from "@/infraestructura/llm/proveedor-falso";
import { RepositorioDocumentosMemoria } from "@/infraestructura/memoria/repositorio-documentos-memoria";
import { RepositorioMemoriasMemoria } from "@/infraestructura/memoria/repositorio-memorias-memoria";
import { RepositorioPaginasMemoria } from "@/infraestructura/memoria/repositorio-paginas-memoria";
import { memoriaDePrueba, nuevoDocumento } from "@/pruebas/fabricas";
import { LimiteExcedido } from "../errores-llm";
import { generarPaginaTema, obtenerPaginaTema, type DependenciasPresentacion } from "./paginas-tema";

const PAGINA_VALIDA = {
  ui: [
    { Encabezado: { props: { titulo: "Tumor", subtitulo: null } } },
    { Parrafo: { props: { texto: "Un [[tumor]] puede ser [[benigno]]." } } },
    { Cifra: { props: { valor: "1 de 3", descripcion: "d", fuente: 1 } } },
    { SiguientesTemas: { props: { temas: [{ etiqueta: "Prevención", porQue: "p" }] } } },
  ],
};

async function preparar(responder: ConstructorParameters<typeof ProveedorFalso>[0] = () => PAGINA_VALIDA) {
  const documentos = new RepositorioDocumentosMemoria();
  const memorias = new RepositorioMemoriasMemoria(documentos);
  const { documento } = await documentos.registrar(nuevoDocumento({ titulo: "Estudio" }));
  await memorias.guardar(documento.id, memoriaDePrueba({ resumenSencillo: "Un tumor es una masa de células." }));
  const presentador = new ProveedorFalso(responder);
  const deps: DependenciasPresentacion = { paginas: new RepositorioPaginasMemoria(), memorias, presentador };
  return { deps, presentador, memorias, documentoId: documento.id };
}

describe("obtenerPaginaTema", () => {
  it("genera la página con las fuentes encontradas, la revisa y la guarda", async () => {
    const { deps, presentador } = await preparar();

    const resultado = await obtenerPaginaTema("Tumor", deps);

    expect(resultado).toMatchObject({ tipo: "lista", desactualizada: false });
    const pagina = resultado.tipo === "lista" ? resultado.pagina : null;
    expect(pagina).toMatchObject({
      slug: "tumor",
      tema: "tumor",
      estado: "lista",
      versionCorpus: 1,
      palabrasClave: ["prevencion", "benigno"],
      fuentes: [{ numero: 1, titulo: "Un estudio sobre células" }],
    });
    expect(JSON.parse(pagina!.ui).ui.map((n: object) => Object.keys(n)[0])).toEqual([
      "Encabezado",
      "Parrafo",
      "Cifra",
      "Aviso",
      "SiguientesTemas",
      "Fuentes",
    ]);
    expect(presentador.peticiones[0]!.usuario).toContain("<tema>tumor</tema>");
    expect(presentador.peticiones[0]!.usuario).toContain("[1] Un estudio sobre células");
    expect(await deps.paginas.obtener("tumor")).toMatchObject({ estado: "lista" });
  });

  it("sirve la página guardada sin volver a llamar a la IA", async () => {
    const { deps, presentador } = await preparar();
    await obtenerPaginaTema("tumor", deps);

    const resultado = await obtenerPaginaTema("tumor", deps);

    expect(resultado).toMatchObject({ tipo: "lista", desactualizada: false });
    expect(presentador.peticiones).toHaveLength(1);
  });

  it("avisa que la página quedó desactualizada cuando llegó conocimiento nuevo", async () => {
    const { deps, memorias, documentoId } = await preparar();
    await obtenerPaginaTema("tumor", deps);

    await memorias.guardar(documentoId, memoriaDePrueba());

    expect(await obtenerPaginaTema("tumor", deps)).toMatchObject({ tipo: "lista", desactualizada: true });
  });

  it("sin fuentes sobre el tema, guarda una página sin información sin llamar a la IA", async () => {
    const { deps, presentador } = await preparar();

    const resultado = await obtenerPaginaTema("fútbol", deps);

    expect(resultado.tipo === "lista" && JSON.parse(resultado.pagina.ui)).toMatchObject({
      ui: [{ Encabezado: { props: { titulo: "Futbol" } } }, { SinInformacion: {} }],
    });
    expect(presentador.peticiones).toHaveLength(0);
  });

  it("pide volver a consultar si otro ya está generando la misma página", async () => {
    const { deps } = await preparar();
    await deps.paginas.reservar("tumor", "tumor");

    expect(await obtenerPaginaTema("tumor", deps)).toEqual({ tipo: "preparando", reintentarMs: 2_000 });
  });

  it("ante el límite de la IA libera el turno y pide esperar lo indicado", async () => {
    const { deps } = await preparar(() => {
      throw new LimiteExcedido(12_000);
    });

    expect(await obtenerPaginaTema("tumor", deps)).toEqual({ tipo: "preparando", reintentarMs: 12_000 });
    expect(await deps.paginas.obtener("tumor")).toMatchObject({ estado: "error" });
  });

  it("si cita una fuente inexistente, pide la página una vez más", async () => {
    let intentos = 0;
    const { deps, presentador } = await preparar(() => {
      intentos += 1;
      const fuente = intentos === 1 ? 7 : 1;
      return { ui: [{ Cifra: { props: { valor: "1", descripcion: "d", fuente } } }] };
    });

    expect(await obtenerPaginaTema("tumor", deps)).toMatchObject({ tipo: "lista" });
    expect(presentador.peticiones).toHaveLength(2);
  });

  it("si vuelve a fallar, informa el error sin guardar nada", async () => {
    const { deps, presentador } = await preparar(() => ({ ui: [{ Fuentes: { props: { numeros: [7] } } }] }));

    expect(await obtenerPaginaTema("tumor", deps)).toEqual({ tipo: "error" });
    expect(presentador.peticiones).toHaveLength(2);
    expect(await deps.paginas.obtener("tumor")).toMatchObject({ estado: "error", ui: null });
  });

  it("libera el turno y propaga los errores inesperados", async () => {
    const { deps } = await preparar(() => {
      throw new Error("red caída");
    });

    await expect(obtenerPaginaTema("tumor", deps)).rejects.toThrow("red caída");
    expect(await deps.paginas.reservar("tumor", "tumor")).toBe(true);
  });

  it("rechaza un tema sin letras ni números", async () => {
    const { deps } = await preparar();

    expect(await obtenerPaginaTema("¿?", deps)).toEqual({ tipo: "no-valido" });
  });
});

describe("generarPaginaTema", () => {
  it("no regenera si otro ya tiene el turno", async () => {
    const { deps, presentador } = await preparar();
    await deps.paginas.reservar("tumor", "tumor");

    expect(await generarPaginaTema("tumor", deps)).toEqual({ tipo: "ocupada" });
    expect(presentador.peticiones).toHaveLength(0);
  });
});
