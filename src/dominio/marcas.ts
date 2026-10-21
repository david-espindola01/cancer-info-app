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
