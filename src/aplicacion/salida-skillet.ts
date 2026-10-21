import { s } from "@hashbrownai/core";
import type { SalidaJson } from "./puerto-llm";

/** Una salida definida con Skillet: el mismo esquema da el JSON Schema y la validación. */
export function salidaSkillet<E extends s.HashbrownType>(nombre: string, esquema: E): SalidaJson<s.Infer<E>> {
  return {
    nombre,
    jsonSchema: s.toJsonSchema(esquema) as Record<string, unknown>,
    validar(valor) {
      esquema.validate(valor);
      return valor as s.Infer<E>;
    },
  };
}
