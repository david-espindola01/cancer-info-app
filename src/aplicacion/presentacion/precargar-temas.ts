import type { PresupuestoDiario } from "../puertos";
import { generarPaginaTema, type DependenciasPresentacion } from "./paginas-tema";

export interface OpcionesPrecarga {
  /** Cuántas páginas nuevas se preparan, como máximo, después de cada visita. */
  porVisita: number;
  /** Cuántas páginas se pueden precargar por día (el resto de la cuota es para visitas reales). */
  maximoDiario: number;
}

/**
 * Si la IA pide esperar hasta esto, se espera y se reintenta una vez. Pasa casi siempre:
 * Groq descuenta del límite por minuto lo que se pide como máximo, así que justo después
 * de generar una página la siguiente no cabe hasta que avanza la ventana del minuto.
 */
const ESPERA_MAXIMA_MS = 30_000;

const dormir = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

/**
 * Prepara de antemano las páginas a las que lleva la que se acaba de ver (en el orden
 * recomendado), para que al hacer clic ya estén listas. Salta las que ya están al día;
 * si la IA pide esperar poco, espera y reintenta; se detiene si se agota el presupuesto
 * del día o la espera sería larga. Devuelve cuántas páginas preparó.
 */
export async function precargarTemas(
  slugs: string[],
  deps: DependenciasPresentacion & { presupuesto: PresupuestoDiario },
  { porVisita, maximoDiario }: OpcionesPrecarga,
  esperar: (ms: number) => Promise<void> = dormir,
): Promise<number> {
  const version = await deps.memorias.versionCorpus();
  let preparadas = 0;

  for (const slug of slugs) {
    if (preparadas >= porVisita) break;
    const guardada = await deps.paginas.obtener(slug);
    const alDia = guardada?.ui && guardada.versionCorpus === version;
    if (alDia || guardada?.estado === "generando") continue;
    if (!(await deps.presupuesto.consumir("precarga", maximoDiario))) break;

    let resultado = await generarPaginaTema(slug, deps);
    if (resultado.tipo === "esperar" && resultado.esperarMs <= ESPERA_MAXIMA_MS) {
      await esperar(resultado.esperarMs);
      resultado = await generarPaginaTema(slug, deps);
    }
    if (resultado.tipo === "esperar") break;
    if (resultado.tipo === "lista") preparadas += 1;
  }
  return preparadas;
}
