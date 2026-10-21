/**
 * Reglas del modo estricto de Groq (`response_format.json_schema.strict = true`):
 * cada objeto lista todas sus propiedades en `required` y declara
 * `additionalProperties: false`; lo opcional se expresa como `anyOf` con `null`.
 */
const PALABRAS_NO_SOPORTADAS = ["oneOf", "allOf", "not", "if", "patternProperties"] as const;

/** Mapas cuyos valores son esquemas (sus claves son nombres, no palabras de JSON Schema). */
const MAPAS_DE_ESQUEMAS = new Set(["properties", "$defs", "definitions"]);

/** Devuelve las infracciones encontradas; un arreglo vacío significa que el esquema es válido. */
export function infraccionesModoEstricto(esquema: unknown): string[] {
  const infracciones: string[] = [];
  revisarEsquema(esquema, "$", infracciones);
  return infracciones;
}

function revisarEsquema(nodo: unknown, ruta: string, infracciones: string[]): void {
  if (Array.isArray(nodo)) {
    nodo.forEach((hijo, i) => revisarEsquema(hijo, `${ruta}[${i}]`, infracciones));
    return;
  }
  if (!esObjeto(nodo)) return;

  if (nodo.type === "object" || "properties" in nodo) {
    revisarObjeto(nodo, ruta, infracciones);
  }
  for (const palabra of PALABRAS_NO_SOPORTADAS) {
    if (palabra in nodo) infracciones.push(`${ruta}: usa "${palabra}", no soportado`);
  }
  for (const [clave, valor] of Object.entries(nodo)) {
    if (MAPAS_DE_ESQUEMAS.has(clave) && esObjeto(valor)) {
      for (const [nombre, esquema] of Object.entries(valor)) {
        revisarEsquema(esquema, `${ruta}.${clave}.${nombre}`, infracciones);
      }
    } else {
      revisarEsquema(valor, `${ruta}.${clave}`, infracciones);
    }
  }
}

function revisarObjeto(nodo: Record<string, unknown>, ruta: string, infracciones: string[]): void {
  const propiedades = esObjeto(nodo.properties) ? Object.keys(nodo.properties) : [];
  const requeridas = Array.isArray(nodo.required) ? nodo.required : [];
  const faltantes = propiedades.filter((propiedad) => !requeridas.includes(propiedad));

  if (faltantes.length > 0) {
    infracciones.push(`${ruta}: propiedades fuera de "required" (${faltantes.join(", ")})`);
  }
  if (nodo.additionalProperties !== false) {
    infracciones.push(`${ruta}: falta "additionalProperties: false"`);
  }
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}
