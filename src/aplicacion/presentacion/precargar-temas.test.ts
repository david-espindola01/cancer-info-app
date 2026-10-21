import { ProveedorFalso } from "@/infraestructura/llm/proveedor-falso";
import { PresupuestoDiarioMemoria } from "@/infraestructura/memoria/presupuesto-diario-memoria";
import { RepositorioDocumentosMemoria } from "@/infraestructura/memoria/repositorio-documentos-memoria";
import { RepositorioMemoriasMemoria } from "@/infraestructura/memoria/repositorio-memorias-memoria";
import { RepositorioPaginasMemoria } from "@/infraestructura/memoria/repositorio-paginas-memoria";
import { memoriaDePrueba, nuevoDocumento } from "@/pruebas/fabricas";
import { LimiteExcedido } from "../errores-llm";
import { obtenerPaginaTema } from "./paginas-tema";
import { precargarTemas } from "./precargar-temas";

const PAGINA = { ui: [{ Parrafo: { props: { texto: "Texto" } } }] };
const opciones = { porVisita: 2, maximoDiario: 10 };

async function preparar(responder: ConstructorParameters<typeof ProveedorFalso>[0] = () => PAGINA) {
  const documentos = new RepositorioDocumentosMemoria();
  const memorias = new RepositorioMemoriasMemoria(documentos);
  const { documento } = await documentos.registrar(nuevoDocumento());
  await memorias.guardar(
    documento.id,
    memoriaDePrueba({ resumenSencillo: "Tabaco, dieta, ejercicio, sol y alcohol se estudiaron." }),
  );
  const presentador = new ProveedorFalso(responder);
  const deps = {
    paginas: new RepositorioPaginasMemoria(),
    memorias,
    presentador,
    presupuesto: new PresupuestoDiarioMemoria(),
  };
  return { deps, presentador, memorias, documentoId: documento.id };
}

describe("precargarTemas", () => {
  it("prepara en orden las primeras páginas, hasta el máximo por visita", async () => {
    const { deps } = await preparar();

    expect(await precargarTemas(["tabaco", "dieta", "ejercicio"], deps, opciones)).toBe(2);

    expect(await deps.paginas.obtener("tabaco")).toMatchObject({ estado: "lista" });
    expect(await deps.paginas.obtener("dieta")).toMatchObject({ estado: "lista" });
    expect(await deps.paginas.obtener("ejercicio")).toBeNull();
  });

  it("salta las páginas que ya están al día o que otro está generando", async () => {
    const { deps, presentador } = await preparar();
    await obtenerPaginaTema("tabaco", deps);
    await deps.paginas.reservar("dieta", "dieta");

    expect(await precargarTemas(["tabaco", "dieta", "ejercicio"], deps, opciones)).toBe(1);

    expect(presentador.peticiones.map((p) => p.usuario.match(/<tema>(.*)<\/tema>/)?.[1])).toEqual([
      "tabaco",
      "ejercicio",
    ]);
  });

  it("vuelve a preparar una página que quedó desactualizada", async () => {
    const { deps, memorias, documentoId } = await preparar();
    await obtenerPaginaTema("tabaco", deps);
    await memorias.guardar(documentoId, memoriaDePrueba({ resumenSencillo: "Tabaco otra vez." }));

    expect(await precargarTemas(["tabaco"], deps, opciones)).toBe(1);
    expect(await deps.paginas.obtener("tabaco")).toMatchObject({ versionCorpus: 2 });
  });

  it("se detiene al agotar el presupuesto del día", async () => {
    const { deps } = await preparar();

    expect(await precargarTemas(["tabaco", "dieta"], deps, { porVisita: 5, maximoDiario: 1 })).toBe(1);
    expect(await precargarTemas(["sol"], deps, { porVisita: 5, maximoDiario: 1 })).toBe(0);
    expect(await deps.paginas.obtener("sol")).toBeNull();
  });

  it("se detiene si la IA llega a su límite", async () => {
    const { deps, presentador } = await preparar(() => {
      throw new LimiteExcedido(5_000);
    });

    expect(await precargarTemas(["tabaco", "dieta"], deps, opciones)).toBe(0);
    expect(presentador.peticiones).toHaveLength(1);
  });

  it("no cuenta las páginas que no se pudieron preparar", async () => {
    const { deps } = await preparar(() => ({ ui: [{ Fuentes: { props: { numeros: [9] } } }] }));

    expect(await precargarTemas(["tabaco"], deps, opciones)).toBe(0);
  });
});
