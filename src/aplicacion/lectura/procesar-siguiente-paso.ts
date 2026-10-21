import { LimiteExcedido, RespuestaInvalida } from "../errores-llm";
import type { ProveedorLLM } from "../puerto-llm";
import type { RepositorioDocumentos, RepositorioMemorias } from "../puertos";
import { consolidarNotas } from "./consolidar-notas";
import { salidaMemoria, salidaNotas } from "./esquemas";
import { comoDocumento, INSTRUCCIONES_MEMORIA, INSTRUCCIONES_NOTAS } from "./instrucciones";

/**
 * Tope de tokens de respuesta del Lector (incluye su razonamiento). Groq descuenta del
 * límite por minuto lo que se pide como máximo: un tope ajustado evita esperas inútiles.
 * Medido en la Fase 4 con gpt-oss-120b: notas ~1.300 tokens y memoria ~1.100 tokens.
 */
const MAX_TOKENS_LECTOR = 3_000;

export interface DependenciasLectura {
  documentos: RepositorioDocumentos;
  memorias: RepositorioMemorias;
  lector: ProveedorLLM;
}

export type ResultadoPaso =
  | { tipo: "avance"; procesados: number; total: number }
  | { tipo: "esperar"; esperarMs: number }
  | { tipo: "listo" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "no-existe" };

/**
 * Avanza un paso en la lectura de un documento: extrae las notas del siguiente
 * fragmento pendiente o, si ya no quedan, consolida la memoria. Cada llamada hace a
 * lo sumo una petición al modelo, así que se puede repetir y reanudar sin perder trabajo.
 */
export async function procesarSiguientePaso(
  documentoId: string,
  { documentos, memorias, lector }: DependenciasLectura,
): Promise<ResultadoPaso> {
  const documento = await documentos.obtener(documentoId);
  if (!documento) return { tipo: "no-existe" };
  if (documento.estado === "listo") return { tipo: "listo" };

  await documentos.cambiarEstado(documentoId, "procesando");
  try {
    const fragmento = await documentos.siguienteFragmentoPendiente(documentoId);
    if (fragmento) {
      const notas = await lector.generarJson({
        salida: salidaNotas,
        sistema: INSTRUCCIONES_NOTAS,
        usuario: comoDocumento(fragmento.texto),
        maxTokensSalida: MAX_TOKENS_LECTOR,
      });
      await documentos.guardarNotas(documentoId, fragmento.orden, notas);
      return { tipo: "avance", ...(await documentos.progreso(documentoId)) };
    }

    const notas = await documentos.listarNotas(documentoId);
    const memoria = await lector.generarJson({
      salida: salidaMemoria,
      sistema: INSTRUCCIONES_MEMORIA,
      usuario: comoDocumento(consolidarNotas(documento.titulo, notas)),
      maxTokensSalida: MAX_TOKENS_LECTOR,
    });
    await memorias.guardar(documentoId, memoria);
    await documentos.cambiarEstado(documentoId, "listo");
    return { tipo: "listo" };
  } catch (error) {
    if (error instanceof LimiteExcedido) return { tipo: "esperar", esperarMs: error.esperarMs };
    if (error instanceof RespuestaInvalida) {
      const mensaje = "La IA no devolvió una respuesta válida. Se puede reintentar.";
      await documentos.cambiarEstado(documentoId, "error", mensaje);
      return { tipo: "error", mensaje };
    }
    throw error;
  }
}
