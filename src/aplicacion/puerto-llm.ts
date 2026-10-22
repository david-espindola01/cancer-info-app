/** Qué forma debe tener la respuesta del modelo y cómo se comprueba. */
export interface SalidaJson<T> {
  /** Nombre corto del esquema (lo exige la API de salida estructurada). */
  nombre: string;
  jsonSchema: Record<string, unknown>;
  /** Devuelve el valor tipado o lanza un error si no cumple el esquema. */
  validar(valor: unknown): T;
}

export interface PeticionJson<T> {
  salida: SalidaJson<T>;
  sistema: string;
  usuario: string;
  /** Tope de tokens de respuesta (incluye el razonamiento del modelo). */
  maxTokensSalida: number;
}

/**
 * Un modelo de lenguaje que responde JSON que cumple un esquema.
 * Lanza `LimiteExcedido` o `RespuestaInvalida` (ver errores-llm.ts).
 */
export interface ProveedorLLM {
  generarJson<T>(peticion: PeticionJson<T>): Promise<T>;
}
