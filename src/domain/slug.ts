const MAX_LENGTH = 80;

/**
 * Turns a topic into a stable identifier for URLs and the cache: lowercase, no accents,
 * words separated by hyphens. «¿Qué es el Cáncer?» → «que-es-el-cancer».
 */
export function normalizeSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_LENGTH)
    .replace(/^-+|-+$/g, "");
}
