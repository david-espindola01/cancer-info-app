import OpenAI from "openai";
import { LimiteExcedido, RespuestaInvalida } from "@/aplicacion/errores-llm";
import type { PeticionJson, ProveedorLLM } from "@/aplicacion/puerto-llm";
import { infraccionesModoEstricto } from "./esquema-estricto";

const URL_GROQ = "https://api.groq.com/openai/v1";
/** Si Groq no indica cuánto esperar tras un 429, se reintenta en este tiempo. */
const ESPERA_POR_DEFECTO_MS = 15_000;

export type EsfuerzoRazonamiento = "low" | "medium" | "high";

export interface OpcionesGroq {
  apiKey: string;
  modelo: string;
  /** "low" usa ~70 % menos tokens de salida (medido en la Fase 1). */
  esfuerzo: EsfuerzoRazonamiento;
  /** Para pruebas: reemplaza el fetch global. */
  fetch?: typeof fetch;
  /** Se avisa cuántos tokens gastó cada llamada (para el panel de uso). Si falla, no interrumpe nada. */
  alRegistrarUso?: (uso: { modelo: string; tokens: number }) => Promise<void>;
}

/** Proveedor LLM sobre Groq con salida estructurada en modo estricto. */
export class ProveedorGroq implements ProveedorLLM {
  private readonly cliente: OpenAI;

  constructor(private readonly opciones: OpcionesGroq) {
    // Sin reintentos automáticos: los límites los maneja quien llama (LimiteExcedido).
    this.cliente = new OpenAI({ apiKey: opciones.apiKey, baseURL: URL_GROQ, maxRetries: 0, fetch: opciones.fetch });
  }

  async generarJson<T>(peticion: PeticionJson<T>): Promise<T> {
    const { salida } = peticion;
    const esquema = esquemaParaGroq(salida.jsonSchema);
    const inicio = Date.now();

    const respuesta = await this.cliente.chat.completions
      .create({
        model: this.opciones.modelo,
        temperature: 0.2,
        reasoning_effort: this.opciones.esfuerzo,
        max_completion_tokens: peticion.maxTokensSalida,
        messages: [
          { role: "system", content: peticion.sistema },
          { role: "user", content: peticion.usuario },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: salida.nombre, strict: true, schema: esquema },
        },
      })
      .catch(traducirError);

    const { modelo, alRegistrarUso } = this.opciones;
    console.info(
      JSON.stringify({
        evento: "llm",
        modelo,
        esquema: salida.nombre,
        tokensEntrada: respuesta.usage?.prompt_tokens,
        tokensSalida: respuesta.usage?.completion_tokens,
        ms: Date.now() - inicio,
      }),
    );
    await alRegistrarUso?.({ modelo, tokens: respuesta.usage?.total_tokens ?? 0 }).catch((error: unknown) =>
      console.error(JSON.stringify({ evento: "uso-llm-no-registrado", modelo, error: String(error) })),
    );
    return validar(respuesta.choices[0]?.message.content, salida.validar);
  }
}

function esquemaParaGroq(original: Record<string, unknown>): Record<string, unknown> {
  const jsonSchema = { ...original };
  delete jsonSchema.$schema;
  const infracciones = infraccionesModoEstricto(jsonSchema);
  if (infracciones.length > 0) {
    throw new Error(`El esquema no cumple el modo estricto de Groq:\n${infracciones.join("\n")}`);
  }
  return jsonSchema;
}

function traducirError(error: unknown): never {
  if (error instanceof OpenAI.APIError && error.status === 429) {
    const esperarMs = esperaIndicada(error.headers) ?? ESPERA_POR_DEFECTO_MS;
    // Queda registrado para poder diagnosticar páginas que tardan en aparecer.
    console.warn(JSON.stringify({ evento: "llm-limite", esperarMs, detalle: error.message }));
    throw new LimiteExcedido(esperarMs);
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

function validar<T>(contenido: string | null | undefined, validarSalida: (valor: unknown) => T): T {
  try {
    return validarSalida(JSON.parse(contenido ?? ""));
  } catch (error) {
    throw new RespuestaInvalida((error as Error).message);
  }
}
