import { pedirPaso } from "./cliente-api";

const esperarMs = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

/**
 * Pide pasos de lectura hasta que el documento queda listo o con error, informando
 * el progreso. Cuando la IA alcanza su límite por minuto, espera lo que indica el servidor.
 */
export async function leerDocumento(
  id: string,
  alProgresar: (mensaje: string) => void,
  esperar: (ms: number) => Promise<void> = esperarMs,
): Promise<void> {
  for (;;) {
    const resultado = await pedirPaso(id).catch(() => ({ tipo: "error" as const }));
    switch (resultado.tipo) {
      case "avance":
        alProgresar(
          resultado.procesados < resultado.total
            ? `Leyendo parte ${resultado.procesados + 1} de ${resultado.total}…`
            : "Escribiendo la memoria del artículo…",
        );
        break;
      case "esperar":
        alProgresar(`Esperando el límite de uso de la IA (${Math.ceil(resultado.esperarMs / 1000)} s)…`);
        await esperar(resultado.esperarMs);
        break;
      case "listo":
      case "error":
        return;
    }
  }
}
