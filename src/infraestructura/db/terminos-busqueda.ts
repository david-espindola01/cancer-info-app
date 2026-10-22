/** Palabras de menos letras que esto («de», «el», «la») no aportan a la búsqueda. */
const LARGO_MINIMO = 3;

/**
 * Extrae de una consulta libre las palabras que se pueden pasar a `to_tsquery`
 * sin riesgo: solo letras y números, sin operadores ni signos.
 */
export function terminosDeBusqueda(consulta: string): string[] {
  const palabras = consulta
    .normalize("NFC")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((palabra) => palabra.length >= LARGO_MINIMO);
  return [...new Set(palabras)];
}
