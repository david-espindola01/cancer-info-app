const LONGITUD_MAXIMA = 80;

/**
 * Convierte un tema en un identificador estable para URLs y caché:
 * minúsculas, sin tildes, palabras separadas por guiones.
 * «¿Qué es el Cáncer?» → «que-es-el-cancer».
 */
export function normalizarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, LONGITUD_MAXIMA)
    .replace(/^-+|-+$/g, "");
}
