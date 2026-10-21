import type { PaginaTema } from "@/dominio/pagina";
import { normalizarSlug } from "@/dominio/slug";
import { LimiteExcedido, RespuestaInvalida } from "../errores-llm";
import type { ProveedorLLM } from "../puerto-llm";
import type { MemoriaEncontrada, NuevaPagina, RepositorioMemorias, RepositorioPaginas } from "../puertos";
import { INSTRUCCIONES_PRESENTADOR, mensajePresentador } from "./instrucciones";
import { prepararMaterial } from "./material";
import { paginaSinInformacion, revisarPagina, salidaPagina } from "./pagina-ui";

/** Cuántas memorias se usan como fuentes de una página (además del tope de caracteres). */
const MAX_FUENTES = 3;
/** Tope de tokens de la página generada (incluye el razonamiento del modelo). */
const MAX_TOKENS_PRESENTADOR = 2_500;
/** Si la página cita una fuente inexistente, se pide una vez más antes de desistir. */
const INTENTOS = 2;
/** Cada cuánto vuelve a consultar el navegador si otro ya está generando la página. */
const REINTENTO_SI_OCUPADA_MS = 2_000;

export interface DependenciasPresentacion {
  paginas: RepositorioPaginas;
  memorias: RepositorioMemorias;
  presentador: ProveedorLLM;
}

type PaginaLista = PaginaTema & { ui: string };

type ResultadoGeneracion =
  | { tipo: "lista"; pagina: PaginaLista }
  | { tipo: "ocupada" }
  | { tipo: "esperar"; esperarMs: number }
  | { tipo: "error" };

export type ResultadoTema =
  | { tipo: "lista"; pagina: PaginaLista; desactualizada: boolean }
  | { tipo: "preparando"; reintentarMs: number }
  | { tipo: "limite" }
  | { tipo: "error" }
  | { tipo: "no-valido" };

/** Para servir páginas: además decide si este visitante puede pedir una página nueva ahora. */
export type DependenciasVisita = DependenciasPresentacion & { permitirGeneracion: () => Promise<boolean> };

/**
 * La página de un tema: la guardada si existe (avisando si quedó desactualizada para
 * regenerarla aparte) o una recién generada, si el visitante no superó su límite de páginas
 * nuevas. Nunca genera dos veces la misma página a la vez.
 */
export async function obtenerPaginaTema(entrada: string, deps: DependenciasVisita): Promise<ResultadoTema> {
  const slug = normalizarSlug(entrada);
  if (!slug) return { tipo: "no-valido" };

  const guardada = await deps.paginas.obtener(slug);
  if (guardada?.ui) {
    const version = await deps.memorias.versionCorpus();
    const desactualizada = guardada.versionCorpus !== version && guardada.estado !== "generando";
    return { tipo: "lista", pagina: { ...guardada, ui: guardada.ui }, desactualizada };
  }
  if (!(await deps.permitirGeneracion())) return { tipo: "limite" };

  const resultado = await generarPaginaTema(slug, deps);
  switch (resultado.tipo) {
    case "lista":
      return { tipo: "lista", pagina: resultado.pagina, desactualizada: false };
    case "ocupada":
      return { tipo: "preparando", reintentarMs: REINTENTO_SI_OCUPADA_MS };
    case "esperar":
      return { tipo: "preparando", reintentarMs: resultado.esperarMs };
    case "error":
      return { tipo: "error" };
  }
}

/** Genera (o regenera) y guarda la página de un tema a partir de las memorias que lo tratan. */
export async function generarPaginaTema(slug: string, deps: DependenciasPresentacion): Promise<ResultadoGeneracion> {
  const tema = slug.replaceAll("-", " ");
  if (!(await deps.paginas.reservar(slug, tema))) return { tipo: "ocupada" };

  try {
    const versionCorpus = await deps.memorias.versionCorpus();
    const encontradas = await deps.memorias.buscar(tema, MAX_FUENTES);
    const contenido =
      encontradas.length > 0
        ? await presentar(slug, tema, encontradas, deps.presentador)
        : { ui: JSON.stringify(paginaSinInformacion(tema)), fuentes: [], palabrasClave: [] };

    const nueva: NuevaPagina = { slug, tema, versionCorpus, ...contenido };
    await deps.paginas.guardar(nueva);
    return { tipo: "lista", pagina: { ...nueva, estado: "lista" } };
  } catch (error) {
    await deps.paginas.liberar(slug);
    if (error instanceof LimiteExcedido) return { tipo: "esperar", esperarMs: error.esperarMs };
    if (error instanceof RespuestaInvalida) return { tipo: "error" };
    throw error;
  }
}

async function presentar(slug: string, tema: string, encontradas: MemoriaEncontrada[], presentador: ProveedorLLM) {
  const material = prepararMaterial(encontradas);
  for (let intento = 1; ; intento += 1) {
    try {
      const respuesta = await presentador.generarJson({
        salida: salidaPagina,
        sistema: INSTRUCCIONES_PRESENTADOR,
        usuario: mensajePresentador(tema, material.texto),
        maxTokensSalida: MAX_TOKENS_PRESENTADOR,
      });
      const { pagina, palabrasClave } = revisarPagina(respuesta, material, slug);
      return { ui: JSON.stringify(pagina), fuentes: material.fuentes, palabrasClave };
    } catch (error) {
      if (!(error instanceof RespuestaInvalida) || intento >= INTENTOS) throw error;
    }
  }
}
