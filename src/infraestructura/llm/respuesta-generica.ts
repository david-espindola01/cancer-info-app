type Esquema = Record<string, unknown>;

/** Más allá de esta profundidad, las listas quedan vacías (corta esquemas recursivos). */
const PROFUNDIDAD_MAXIMA = 6;

/**
 * Construye una respuesta válida para un JSON Schema (objetos, listas, enums, anyOf,
 * $ref), con textos tomados de `texto`. La usa el modo `LLM_PROVEEDOR=falso` para
 * recorrer los flujos completos en CI y en pruebas e2e sin llamar a un modelo real.
 */
export function respuestaDesdeEsquema(esquema: Esquema, texto: string): unknown {
  const frases = texto
    .replace(/<\/?[a-z]+>/gi, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((frase) => frase.trim())
    .filter((frase) => frase.length > 0);
  let siguiente = 0;
  const frase = () => (frases.length > 0 ? frases[siguiente++ % frases.length]! : "Texto de prueba.");

  const definiciones = (esquema.$defs ?? {}) as Record<string, Esquema>;

  function construir(nodo: Esquema, profundidad: number): unknown {
    if (typeof nodo.$ref === "string") {
      return construir(definiciones[nodo.$ref.replace("#/$defs/", "")] ?? {}, profundidad);
    }
    if (Array.isArray(nodo.anyOf)) {
      const opciones = nodo.anyOf as Esquema[];
      return construir(opciones.find((opcion) => opcion.type !== "null") ?? opciones[0]!, profundidad);
    }
    if (Array.isArray(nodo.enum)) return nodo.enum[0];
    switch (nodo.type) {
      case "object": {
        const propiedades = (nodo.properties ?? {}) as Record<string, Esquema>;
        return Object.fromEntries(
          Object.entries(propiedades).map(([clave, valor]) => [clave, construir(valor, profundidad + 1)]),
        );
      }
      case "array":
        return profundidad >= PROFUNDIDAD_MAXIMA ? [] : [construir(nodo.items as Esquema, profundidad + 1)];
      case "number":
      case "integer":
        return 1;
      case "boolean":
        return true;
      case "null":
        return null;
      default:
        return frase();
    }
  }

  return construir(esquema, 0);
}
