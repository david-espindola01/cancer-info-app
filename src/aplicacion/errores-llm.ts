/** El proveedor alcanzó su límite de uso; se puede reintentar después de `esperarMs`. */
export class LimiteExcedido extends Error {
  constructor(readonly esperarMs: number) {
    super(`Límite del proveedor de IA alcanzado; reintentar en ${esperarMs} ms.`);
    this.name = "LimiteExcedido";
  }
}

/** El modelo respondió algo que no cumple el esquema pedido. */
export class RespuestaInvalida extends Error {
  constructor(detalle: string) {
    super(`El modelo no devolvió una respuesta válida: ${detalle}`);
    this.name = "RespuestaInvalida";
  }
}
