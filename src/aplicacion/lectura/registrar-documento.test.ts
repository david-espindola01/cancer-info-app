import { RepositorioDocumentosMemoria } from "@/infraestructura/memoria/repositorio-documentos-memoria";
import { notasDePrueba } from "@/pruebas/fabricas";
import { registrarDocumento } from "./registrar-documento";

const parrafo = "Las células del cuerpo se renuevan de forma ordenada. ".repeat(30);

describe("registrarDocumento", () => {
  let documentos: RepositorioDocumentosMemoria;

  beforeEach(() => {
    documentos = new RepositorioDocumentosMemoria();
  });

  it("guarda el texto limpio en fragmentos que caben en una petición al Lector", async () => {
    const texto = Array.from({ length: 20 }, () => parrafo).join("\n\n");

    const resultado = await registrarDocumento({ titulo: " Estudio.pdf ", texto }, documentos);

    expect(resultado).toMatchObject({ tipo: "creado", documento: { titulo: "Estudio.pdf", estado: "pendiente" } });
    const id = resultado.tipo === "creado" ? resultado.documento.id : "";
    let fragmentos = 0;
    for (let f = await documentos.siguienteFragmentoPendiente(id); f; f = await documentos.siguienteFragmentoPendiente(id)) {
      expect(f.texto.length).toBeLessThanOrEqual(12_000);
      await documentos.guardarNotas(id, f.orden, notasDePrueba());
      fragmentos += 1;
    }
    expect(fragmentos).toBeGreaterThan(1);
  });

  it("reconoce el mismo artículo aunque cambien el nombre y los espacios", async () => {
    await registrarDocumento({ titulo: "a.pdf", texto: parrafo }, documentos);

    const resultado = await registrarDocumento({ titulo: "b.pdf", texto: `  ${parrafo}\n\n` }, documentos);

    expect(resultado).toMatchObject({ tipo: "existente", documento: { titulo: "a.pdf" } });
  });

  it("rechaza un PDF sin texto suficiente (por ejemplo, escaneado)", async () => {
    expect(await registrarDocumento({ titulo: "x.pdf", texto: "Página 1\n\n" }, documentos)).toEqual({
      tipo: "sin-texto",
    });
    expect(await documentos.listar()).toEqual([]);
  });

  it("pone un título por defecto si viene vacío", async () => {
    const resultado = await registrarDocumento({ titulo: "  ", texto: parrafo }, documentos);

    expect(resultado).toMatchObject({ documento: { titulo: "Documento sin título" } });
  });
});
