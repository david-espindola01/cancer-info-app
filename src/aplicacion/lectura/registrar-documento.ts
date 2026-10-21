import type { Documento } from "@/dominio/documento";
import { fragmentar, huellaTexto, limpiarTexto } from "@/dominio/texto";
import type { RepositorioDocumentos } from "../puertos";

/**
 * Tamaño de cada fragmento que lee el Agente Lector. Unos 12.000 caracteres son
 * ~3.000 tokens; sumando instrucciones, esquema y respuesta, cada petición queda
 * en ~5.000 tokens, por debajo del límite de 8.000 tokens por minuto de Groq.
 */
const MAX_CARACTERES_FRAGMENTO = 12_000;

/** Un artículo científico extenso tiene ~150.000 caracteres; más que esto no es un artículo. */
export const MAX_CARACTERES_DOCUMENTO = 400_000;

/** Por debajo de esto el PDF casi no tiene texto (por ejemplo, es una imagen escaneada). */
const MIN_CARACTERES_TEXTO = 500;

export type ResultadoRegistro =
  | { tipo: "creado"; documento: Documento }
  | { tipo: "existente"; documento: Documento }
  | { tipo: "sin-texto" };

export async function registrarDocumento(
  entrada: { titulo: string; texto: string },
  documentos: RepositorioDocumentos,
): Promise<ResultadoRegistro> {
  const texto = limpiarTexto(entrada.texto);
  if (texto.length < MIN_CARACTERES_TEXTO) return { tipo: "sin-texto" };

  const { documento, creado } = await documentos.registrar({
    titulo: entrada.titulo.trim() || "Documento sin título",
    huella: huellaTexto(texto),
    fragmentos: fragmentar(texto, MAX_CARACTERES_FRAGMENTO),
  });
  return { tipo: creado ? "creado" : "existente", documento };
}
