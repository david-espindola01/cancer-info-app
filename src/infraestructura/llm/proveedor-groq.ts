import { s } from "@hashbrownai/core";
import OpenAI from "openai";
import { LimiteExcedido, RespuestaInvalida } from "@/aplicacion/errores-llm";
import type { PeticionJson, ProveedorLLM } from "@/aplicacion/puertos";
import { infraccionesModoEstricto } from "./esquema-estricto";

const URL_GROQ = "https://api.groq.com/openai/v1";
/** Si Groq no indica cuánto esperar tras un 429, se reintenta en este tiempo. */
const ESPERA_POR_DEFECTO_MS = 15_000;
/**
 * Tope de tokens de salida (incluye el razonamiento). Groq descuenta del límite por
 * minuto lo que se pide como máximo, así que un tope ajustado evita esperas inútiles.
 * Medido en la Fase 4 con gpt-oss-120b: notas ~1.300 tokens y memoria ~1.100 tokens.
 */
const MAX_TOKENS_SALIDA = 3_000;

export type EsfuerzoRazonamiento = "low" | "medium" | "high";

export interface OpcionesGroq {
  apiKey: string;
  modelo: string;
  /** "low" usa ~70 % menos tokens de salida (medido en la Fase 1). */
  esfuerzo: EsfuerzoRazonamiento;
  /** Para pruebas: reemplaza el fetch global. */
  fetch?: typeof fetch;
}

/** Proveedor LLM sobre Groq con salida estructurada en modo estricto. */
export class ProveedorGroq implements ProveedorLLM {
  private readonly cliente: OpenAI;

  constructor(private readonly opciones: OpcionesGroq) {
    // Sin reintentos automáticos: los límites los maneja quien llama (LimiteExcedido).
    this.cliente = new OpenAI({ apiKey: opciones.apiKey, baseURL: URL_GROQ, maxRetries: 0, fetch: opciones.fetch });
  }

  async generarJson<E extends s.HashbrownType>(peticion: PeticionJson<E>): Promise<s.Infer<E>> {
    const esquema = esquemaParaGroq(peticion.esquema);
    const inicio = Date.now();

    const respuesta = await this.cliente.chat.completions
      .create({
        model: this.opciones.modelo,
        temperature: 0.2,
        reasoning_effort: this.opciones.esfuerzo,
        max_completion_tokens: MAX_TOKENS_SALIDA,
        messages: [
          { role: "system", content: peticion.sistema },
          { role: "user", content: peticion.usuario },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: peticion.nombre, strict: true, schema: esquema },
        },
      })
      .catch(traducirError);

    console.info(
      JSON.stringify({
        evento: "llm",
        modelo: this.opciones.modelo,
        esquema: peticion.nombre,
        tokensEntrada: respuesta.usage?.prompt_tokens,
        tokensSalida: respuesta.usage?.completion_tokens,
        ms: Date.now() - inicio,
      }),
    );
    return validar(respuesta.choices[0]?.message.content, peticion.esquema);
  }
}

function esquemaParaGroq(esquema: s.HashbrownType): Record<string, unknown> {
  const jsonSchema = { ...(s.toJsonSchema(esquema) as Record<string, unknown>) };
  delete jsonSchema.$schema;
  const infracciones = infraccionesModoEstricto(jsonSchema);
  if (infracciones.length > 0) {
    throw new Error(`El esquema no cumple el modo estricto de Groq:\n${infracciones.join("\n")}`);
  }
  return jsonSchema;
}

function traducirError(error: unknown): never {
  if (error instanceof OpenAI.APIError && error.status === 429) {
    throw new LimiteExcedido(esperaIndicada(error.headers) ?? ESPERA_POR_DEFECTO_MS);
  }
  if (error instanceof OpenAI.APIError && error.status === 400) {
    throw new RespuestaInvalida(error.message);
  }
  throw error;
}

/** Lee `retry-after` (segundos) o `x-ratelimit-reset-tokens` (p. ej. «11.6s», «1m2s»). */
function esperaIndicada(encabezados: Headers | undefined): number | undefined {
  const reintentar = Number(encabezados?.get("retry-after"));
  if (reintentar > 0) return Math.ceil(reintentar * 1000);

  const reinicio = encabezados?.get("x-ratelimit-reset-tokens");
  const partes = reinicio?.match(/^(?:(\d+)m)?(?:([\d.]+)s)?$/);
  if (!partes || (!partes[1] && !partes[2])) return undefined;
  return Math.ceil((Number(partes[1] ?? 0) * 60 + Number(partes[2] ?? 0)) * 1000);
}

function validar<E extends s.HashbrownType>(contenido: string | null | undefined, esquema: E): s.Infer<E> {
  try {
    const valor: unknown = JSON.parse(contenido ?? "");
    esquema.validate(valor);
    return valor as s.Infer<E>;
  } catch (error) {
    throw new RespuestaInvalida((error as Error).message);
  }
}
