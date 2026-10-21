import type { NotasFragmento } from "./esquemas";

/**
 * Máximo de elementos por lista que pasan a la consolidación. Mantiene la petición
 * final por debajo de ~4.000 tokens aunque el artículo tenga muchos fragmentos.
 */
const MAXIMOS = { hallazgos: 25, cifras: 15, conceptos: 20, limitaciones: 10 } as const;

/** Une las notas de todos los fragmentos en un texto compacto, sin repetidos y con tope por lista. */
export function consolidarNotas(titulo: string, notas: NotasFragmento[]): string {
  const unir = <T>(lista: (n: NotasFragmento) => T[], clave: (x: T) => string, maximo: number) =>
    sinRepetidos(notas.flatMap(lista), clave).slice(0, maximo);

  const hallazgos = unir((n) => n.hallazgos, (h) => h, MAXIMOS.hallazgos);
  const cifras = unir((n) => n.cifras, (c) => `${c.valor}|${c.descripcion}`, MAXIMOS.cifras);
  const conceptos = unir((n) => n.conceptos, (c) => c.termino, MAXIMOS.conceptos);
  const limitaciones = unir((n) => n.limitaciones, (l) => l, MAXIMOS.limitaciones);
  const cita = notas.map((n) => n.datosDeCita.trim()).find((datos) => datos.length > 0) ?? "No indicado";

  return [
    `Título del archivo: ${titulo}`,
    `Datos de cita: ${cita}`,
    seccion("Hallazgos", hallazgos),
    seccion("Cifras", cifras.map((c) => `${c.valor}: ${c.descripcion}`)),
    seccion("Términos", conceptos.map((c) => `${c.termino}: ${c.explicacion}`)),
    seccion("Limitaciones", limitaciones),
  ].join("\n\n");
}

function sinRepetidos<T>(lista: T[], clave: (x: T) => string): T[] {
  const vistos = new Set<string>();
  return lista.filter((elemento) => {
    const k = clave(elemento).trim().toLowerCase();
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

function seccion(nombre: string, lineas: string[]): string {
  return `${nombre}:\n${lineas.length > 0 ? lineas.map((l) => `- ${l}`).join("\n") : "- (ninguno)"}`;
}
