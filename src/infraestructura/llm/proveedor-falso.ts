import { s } from "@hashbrownai/core";
import { RespuestaInvalida } from "@/aplicacion/errores-llm";
import type { PeticionJson, ProveedorLLM } from "@/aplicacion/puertos";

type Responder = (peticion: PeticionJson<s.HashbrownType>) => unknown | Promise<unknown>;

/**
 * Proveedor determinista para pruebas y CI: no llama a ninguna API ni gasta cuota.
 * Valida la respuesta contra el esquema igual que el proveedor real.
 */
export class ProveedorFalso implements ProveedorLLM {
  readonly peticiones: PeticionJson<s.HashbrownType>[] = [];

  constructor(private readonly responder: Responder) {}

  async generarJson<E extends s.HashbrownType>(peticion: PeticionJson<E>): Promise<s.Infer<E>> {
    this.peticiones.push(peticion);
    const respuesta = await this.responder(peticion);
    try {
      peticion.esquema.validate(respuesta);
    } catch (error) {
      throw new RespuestaInvalida((error as Error).message);
    }
    return respuesta as s.Infer<E>;
  }
}
