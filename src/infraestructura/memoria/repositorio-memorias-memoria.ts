import type { ContenidoMemoria } from "@/aplicacion/lectura/esquemas";
import type { MemoriaEncontrada, RepositorioDocumentos, RepositorioMemorias } from "@/aplicacion/puertos";
import { terminosDeBusqueda } from "../db/terminos-busqueda";

const sinTildes = (texto: string) => texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * Implementación en memoria para pruebas. La búsqueda es más simple que la de Postgres
 * (palabras exactas sin tildes, sin raíces): el contrato compartido solo exige eso.
 */
export class RepositorioMemoriasMemoria implements RepositorioMemorias {
  private readonly memorias = new Map<string, ContenidoMemoria>();
  private version = 0;

  constructor(private readonly documentos: RepositorioDocumentos) {}

  async guardar(documentoId: string, contenido: ContenidoMemoria) {
    this.memorias.set(documentoId, contenido);
    this.version += 1;
    return this.version;
  }

  async buscar(consulta: string, limite: number) {
    const terminos = terminosDeBusqueda(consulta).map(sinTildes);
    const encontradas: { memoria: MemoriaEncontrada; coincidencias: number }[] = [];

    for (const [documentoId, contenido] of this.memorias) {
      const palabrasDe = (texto: string) => new Set(sinTildes(texto).split(/[^\p{L}\p{N}]+/u));
      const palabras = palabrasDe(valoresDeTexto(contenido).join(" "));
      const documento = await this.documentos.obtener(documentoId);
      const titulo = documento?.titulo ?? "";
      const enTitulo = palabrasDe(`${titulo} ${contenido.tituloSencillo}`);
      // Como en Postgres: cuenta la coincidencia en el texto y, con el doble de peso, en el título.
      const coincidencias =
        terminos.filter((termino) => palabras.has(termino)).length +
        2 * terminos.filter((termino) => enTitulo.has(termino)).length;
      if (coincidencias === 0) continue;
      encontradas.push({ memoria: { documentoId, titulo, contenido }, coincidencias });
    }

    return encontradas
      .sort(
        (a, b) =>
          b.coincidencias - a.coincidencias || a.memoria.documentoId.localeCompare(b.memoria.documentoId),
      )
      .slice(0, limite)
      .map(({ memoria }) => memoria);
  }

  async temasMasFrecuentes(limite: number) {
    const conteo = new Map<string, number>();
    for (const { temas } of this.memorias.values()) {
      for (const tema of temas) conteo.set(tema, (conteo.get(tema) ?? 0) + 1);
    }
    return [...conteo]
      .sort(([a, n], [b, m]) => m - n || a.localeCompare(b))
      .slice(0, limite)
      .map(([tema]) => tema);
  }

  async versionCorpus() {
    return this.version;
  }
}

function valoresDeTexto(valor: unknown): string[] {
  if (typeof valor === "string") return [valor];
  if (Array.isArray(valor)) return valor.flatMap(valoresDeTexto);
  if (valor && typeof valor === "object") return Object.values(valor).flatMap(valoresDeTexto);
  return [];
}
