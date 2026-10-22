import { normalizarSlug } from "./slug";

/**
 * El Agente Presentador marca las palabras clave que el lector puede elegir para seguir
 * aprendiendo: `[[texto]]`, o `[[texto|tema]]` cuando el tema destino se escribe distinto
 * (por ejemplo `[[tumores|tumor]]`).
 */
const MARCA = /\[\[([^[\]|]+?)(?:\|([^[\]|]+?))?\]\]/g;

export type Segmento =
  | { tipo: "texto"; texto: string }
  | { tipo: "tema"; texto: string; slug: string };

/**
 * Marca la primera aparición de `tema` (como palabra completa, sin importar mayúsculas)
 * fuera de las marcas existentes. Devuelve el texto nuevo, o null si no aparece.
 */
export function marcarPrimeraAparicion(texto: string, tema: string): string | null {
  if (!normalizarSlug(tema)) return null;
  const escapado = tema.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patron = new RegExp(`(?<![\\p{L}\\p{N}])${escapado}(?![\\p{L}\\p{N}])`, "iu");

  let marcado = false;
  const partes = segmentarMarcas(texto).map((segmento) => {
    if (segmento.tipo === "tema") return `[[${segmento.texto}|${segmento.slug}]]`;
    if (marcado) return segmento.texto;
    return segmento.texto.replace(patron, (encontrado) => {
      marcado = true;
      return `[[${encontrado}]]`;
    });
  });
  return marcado ? partes.join("") : null;
}

export function segmentarMarcas(texto: string): Segmento[] {
  const segmentos: Segmento[] = [];
  let desde = 0;
  for (const marca of texto.matchAll(MARCA)) {
    const [completa, visible, destino] = marca;
    const slug = normalizarSlug(destino ?? visible!);
    if (marca.index > desde) segmentos.push({ tipo: "texto", texto: texto.slice(desde, marca.index) });
    segmentos.push(slug ? { tipo: "tema", texto: visible!.trim(), slug } : { tipo: "texto", texto: visible! });
    desde = marca.index + completa.length;
  }
  if (desde < texto.length) segmentos.push({ tipo: "texto", texto: texto.slice(desde) });
  return segmentos;
}
