import type { FuentePagina } from "@/dominio/pagina";
import type { MemoriaEncontrada } from "../puertos";

/**
 * Tope del material que recibe el Presentador (~1.300 tokens). Con el esquema del
 * catálogo (~2.900), las instrucciones (~700) y la respuesta, cada página queda
 * por debajo del límite de 8.000 tokens por minuto de Groq.
 */
const MAX_CARACTERES_MATERIAL = 5_000;

/** Cuántos elementos de cada lista de una memoria pasan al material. */
const MAXIMOS = { hallazgos: 5, cifras: 4, conceptos: 5, recomendaciones: 3, limitaciones: 3 } as const;

/**
 * Convierte las memorias encontradas en fuentes numeradas, en texto compacto y dentro
 * del presupuesto. Devuelve también las fuentes para mostrar en la página y los temas que cubren.
 */
export function prepararMaterial(memorias: MemoriaEncontrada[]): {
  texto: string;
  fuentes: FuentePagina[];
  temas: string[];
} {
  const bloques: string[] = [];
  const fuentes: FuentePagina[] = [];
  const temas = new Set<string>();

  for (const { contenido, titulo } of memorias) {
    const numero = fuentes.length + 1;
    const bloque = describirMemoria(numero, contenido);
    if (bloques.length > 0 && [...bloques, bloque].join("\n\n").length > MAX_CARACTERES_MATERIAL) break;

    bloques.push(bloque.slice(0, MAX_CARACTERES_MATERIAL));
    fuentes.push({
      numero,
      titulo: contenido.tituloSencillo,
      referencia: referenciaLegible(contenido.referencia, titulo),
    });
    contenido.temas.forEach((tema) => temas.add(tema));
  }
  return { texto: bloques.join("\n\n"), fuentes, temas: [...temas] };
}

/** «Autores (año) Revista» sin los datos que el Lector no encontró; si no hay ninguno, el título del documento. */
function referenciaLegible(
  { autores, anio, revista }: MemoriaEncontrada["contenido"]["referencia"],
  tituloDocumento: string,
): string {
  const conocido = (valor: string) => valor.trim() !== "" && !/^no indicado$/i.test(valor.trim());
  const quien = [conocido(autores) && autores, conocido(anio) && `(${anio})`].filter(Boolean).join(" ");
  const donde = conocido(revista) ? revista : "";
  return [quien, donde].filter(Boolean).join(". ") || tituloDocumento;
}

function describirMemoria(numero: number, m: MemoriaEncontrada["contenido"]): string {
  const lista = (titulo: string, elementos: string[], maximo: number) =>
    elementos.length > 0 ? `${titulo}:\n${elementos.slice(0, maximo).map((e) => `- ${e}`).join("\n")}` : "";

  return [
    `[${numero}] ${m.tituloSencillo}`,
    `Temas que cubre: ${m.temas.join(", ")}`,
    `Idea central: ${m.ideaCentral}`,
    `Resumen: ${m.resumenSencillo}`,
    lista("Hallazgos", m.hallazgos.map((h) => `${h.texto} (evidencia ${h.solidez})`), MAXIMOS.hallazgos),
    lista("Cifras", m.cifras.map((c) => `${c.valor}: ${c.descripcion}`), MAXIMOS.cifras),
    lista("Términos", m.conceptos.map((c) => `${c.termino}: ${c.explicacion}`), MAXIMOS.conceptos),
    lista("Recomendaciones del estudio", m.recomendaciones, MAXIMOS.recomendaciones),
    lista("Limitaciones", m.limitaciones, MAXIMOS.limitaciones),
  ]
    .filter(Boolean)
    .join("\n");
}
