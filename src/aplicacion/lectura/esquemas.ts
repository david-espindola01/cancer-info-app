import { s } from "@hashbrownai/core";

/*
 * Contratos de salida del Agente Lector. Cada esquema es a la vez el tipo de TypeScript,
 * el JSON Schema que se envía al modelo y el validador de su respuesta.
 */

const cifra = s.object("Un dato numérico del artículo", {
  valor: s.string("El número con su unidad, por ejemplo «1 de cada 8» o «45 %»"),
  descripcion: s.string("Qué mide ese número, en palabras sencillas"),
});

const concepto = s.object("Un término técnico del artículo", {
  termino: s.string("El término tal como se usa en español"),
  explicacion: s.string("Explicación en palabras sencillas, sin otros tecnicismos"),
});

export const esquemaNotasFragmento = s.object("Notas sobre una parte del artículo", {
  hallazgos: s.array("Resultados o afirmaciones del texto", s.string("Un hallazgo")),
  cifras: s.array("Datos numéricos relevantes", cifra),
  conceptos: s.array("Términos técnicos que aparecen", concepto),
  limitaciones: s.array("Limitaciones o advertencias que menciona el texto", s.string("Una limitación")),
  datosDeCita: s.string(
    "Autores, año y revista si aparecen en esta parte (suelen estar al inicio); cadena vacía si no",
  ),
});

export const esquemaMemoria = s.object("Memoria con lo fundamental del artículo", {
  tituloSencillo: s.string("Título del artículo reescrito en palabras sencillas"),
  ideaCentral: s.string("La idea principal en una o dos frases cortas"),
  resumenSencillo: s.string("Resumen de un párrafo para cualquier persona"),
  hallazgos: s.array(
    "Hallazgos principales",
    s.object("Un hallazgo", {
      texto: s.string("El hallazgo en palabras sencillas"),
      solidez: s.enumeration("Qué tan sólida es la evidencia según el propio artículo", [
        "alta",
        "media",
        "baja",
      ]),
    }),
  ),
  conceptos: s.array("Términos técnicos explicados", concepto),
  cifras: s.array("Datos numéricos clave", cifra),
  recomendaciones: s.array("Recomendaciones que hace el artículo", s.string("Una recomendación")),
  limitaciones: s.array("Limitaciones del estudio", s.string("Una limitación")),
  temas: s.array("Palabras clave del artículo, en español y en minúsculas", s.string("Un tema")),
  referencia: s.object("Datos para citar el artículo", {
    autores: s.string("Autores, por ejemplo «García L, Pérez M, et al.»"),
    anio: s.string("Año de publicación"),
    revista: s.string("Revista o fuente"),
  }),
});

export type NotasFragmento = s.Infer<typeof esquemaNotasFragmento>;
export type ContenidoMemoria = s.Infer<typeof esquemaMemoria>;
