import { RespuestaInvalida } from "@/aplicacion/errores-llm";
import type { PeticionJson, ProveedorLLM } from "@/aplicacion/puerto-llm";

type Responder = (peticion: PeticionJson<unknown>) => unknown | Promise<unknown>;

/**
 * Proveedor determinista para pruebas y CI: no llama a ninguna API ni gasta cuota.
 * Valida la respuesta contra el esquema igual que el proveedor real.
 */
export class ProveedorFalso implements ProveedorLLM {
  readonly peticiones: PeticionJson<unknown>[] = [];

  constructor(private readonly responder: Responder) {}

  async generarJson<T>(peticion: PeticionJson<T>): Promise<T> {
    this.peticiones.push(peticion);
    const respuesta = await this.responder(peticion);
    try {
      return peticion.salida.validar(respuesta);
    } catch (error) {
      throw new RespuestaInvalida((error as Error).message);
    }
  }
}
