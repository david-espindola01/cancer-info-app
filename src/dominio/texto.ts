import { createHash } from "node:crypto";

/** Títulos con los que empieza la bibliografía de un artículo científico. */
const TITULO_REFERENCIAS =
  /^\s*(\d+\.?\s*)?(references|referencias|bibliograf[ií]a|bibliography|literature cited)\s*:?\s*$/im;

/** Una línea corta que se repite al menos estas veces es un encabezado o pie de página. */
const REPETICIONES_ENCABEZADO = 3;
const LARGO_MAXIMO_ENCABEZADO = 80;

/**
 * Prepara el texto extraído de un PDF para el Agente Lector: une palabras cortadas
 * con guion, quita encabezados y pies de página repetidos, quita la bibliografía y
 * normaliza los espacios. Los párrafos quedan separados por una línea en blanco.
 */
export function limpiarTexto(texto: string): string {
  const unificado = texto.replace(/\r\n?/g, "\n").replace(/­/g, "");
  const sinReferencias = quitarReferencias(unificado);
  const sinEncabezados = quitarLineasRepetidas(sinReferencias);

  return sinEncabezados
    .replace(/(\p{L})-\n(\p{Ll})/gu, "$1$2")
    .split(/\n\s*\n/)
    .map((parrafo) => parrafo.replace(/\s+/g, " ").trim())
    .filter((parrafo) => parrafo.length > 0)
    .join("\n\n");
}

function quitarReferencias(texto: string): string {
  const coincidencia = TITULO_REFERENCIAS.exec(texto);
  // Solo se corta si la bibliografía está en la segunda mitad (evita cortar un índice inicial).
  if (!coincidencia || coincidencia.index < texto.length / 2) return texto;
  return texto.slice(0, coincidencia.index);
}

function quitarLineasRepetidas(texto: string): string {
  const lineas = texto.split("\n");
  const conteo = new Map<string, number>();
  for (const linea of lineas) {
    const clave = linea.trim();
    if (clave.length > 0 && clave.length <= LARGO_MAXIMO_ENCABEZADO) {
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    }
  }
  return lineas
    .filter((linea) => (conteo.get(linea.trim()) ?? 0) < REPETICIONES_ENCABEZADO)
    .join("\n");
}

/**
 * Divide el texto en fragmentos de como máximo `maxCaracteres`, sin partir párrafos
 * salvo que un párrafo solo ya supere el máximo (entonces se parte por oraciones y,
 * en último caso, por caracteres).
 */
export function fragmentar(texto: string, maxCaracteres: number): string[] {
  const piezas = texto
    .split(/\n\s*\n/)
    .flatMap((parrafo) => partirSiExcede(parrafo.trim(), maxCaracteres))
    .filter((pieza) => pieza.length > 0);

  const fragmentos: string[] = [];
  let actual = "";
  for (const pieza of piezas) {
    const unido = actual ? `${actual}\n\n${pieza}` : pieza;
    if (unido.length <= maxCaracteres) {
      actual = unido;
    } else {
      fragmentos.push(actual);
      actual = pieza;
    }
  }
  if (actual) fragmentos.push(actual);
  return fragmentos;
}

function partirSiExcede(parrafo: string, max: number): string[] {
  if (parrafo.length <= max) return [parrafo];

  const partes: string[] = [];
  let actual = "";
  for (const oracion of parrafo.split(/(?<=[.!?])\s+/)) {
    for (const trozo of cortarPorCaracteres(oracion, max)) {
      const unido = actual ? `${actual} ${trozo}` : trozo;
      if (unido.length <= max) {
        actual = unido;
      } else {
        partes.push(actual);
        actual = trozo;
      }
    }
  }
  if (actual) partes.push(actual);
  return partes;
}

function cortarPorCaracteres(texto: string, max: number): string[] {
  const trozos: string[] = [];
  for (let inicio = 0; inicio < texto.length; inicio += max) {
    trozos.push(texto.slice(inicio, inicio + max));
  }
  return trozos;
}

/** Huella SHA-256 del texto: detecta el mismo artículo subido dos veces. */
export function huellaTexto(texto: string): string {
  return createHash("sha256").update(texto).digest("hex");
}
