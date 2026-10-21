import type { PresupuestoDiario } from "../puertos";
import { generarPaginaTema, type DependenciasPresentacion } from "./paginas-tema";

export interface OpcionesPrecarga {
  /** Cuántas páginas nuevas se preparan, como máximo, después de cada visita. */
  porVisita: number;
  /** Cuántas páginas se pueden precargar por día (el resto de la cuota es para visitas reales). */
  maximoDiario: number;
}

/**
 * Prepara de antemano las páginas a las que lleva la que se acaba de ver (en el orden
 * recomendado), para que al hacer clic ya estén listas. Salta las que ya están al día
 * y se detiene si se agota el presupuesto del día o la IA llega a su límite.
 * Devuelve cuántas páginas preparó.
 */
export async function precargarTemas(
  slugs: string[],
  deps: DependenciasPresentacion & { presupuesto: PresupuestoDiario },
  { porVisita, maximoDiario }: OpcionesPrecarga,
): Promise<number> {
  const version = await deps.memorias.versionCorpus();
  let preparadas = 0;

  for (const slug of slugs) {
    if (preparadas >= porVisita) break;
    const guardada = await deps.paginas.obtener(slug);
    const alDia = guardada?.ui && guardada.versionCorpus === version;
    if (alDia || guardada?.estado === "generando") continue;
    if (!(await deps.presupuesto.consumir("precarga", maximoDiario))) break;

    const resultado = await generarPaginaTema(slug, deps);
    if (resultado.tipo === "esperar") break;
    if (resultado.tipo === "lista") preparadas += 1;
  }
  return preparadas;
}
