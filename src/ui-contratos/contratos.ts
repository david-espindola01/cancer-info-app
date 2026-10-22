import { s, type UiComponentDefinition } from "@hashbrownai/core";

/*
 * Catálogo de interfaces genéricas que el Agente Presentador puede usar para armar una
 * página. Son contratos sin React: el servidor los usa para el esquema que sigue el
 * modelo y el navegador para registrar los componentes. Ninguno se refiere a un tema
 * concreto: sirven para presentar cualquier información.
 *
 * En los textos se pueden marcar palabras clave como [[palabra]] o [[palabra|tema]]:
 * se muestran subrayadas y llevan a la página de ese tema.
 */

const textoConMarcas = (descripcion: string) =>
  s.string(`${descripcion}. Puede marcar palabras clave como [[palabra]] o [[palabra|tema]]`);

const numeroDeFuente = s.number("Número de la fuente que respalda el dato (de la lista de fuentes entregada)");

export const contratoSeccion = {
  name: "Seccion",
  description: "Agrupa bajo un título varios componentes sobre una misma idea.",
  children: "any",
  props: { titulo: s.string("Título corto de la sección") },
} satisfies UiComponentDefinition;

export const contratoEncabezado = {
  name: "Encabezado",
  description: "Título principal de la página. Va una sola vez, al inicio.",
  children: false,
  props: {
    titulo: s.string("Título de la página, en forma de pregunta o frase corta"),
    subtitulo: s.anyOf([s.string("Una frase que resume la página"), s.nullish()]),
  },
} satisfies UiComponentDefinition;

export const contratoParrafo = {
  name: "Parrafo",
  description: "Un párrafo de explicación: de dos a cuatro frases cortas y sencillas.",
  children: false,
  props: { texto: textoConMarcas("El párrafo") },
} satisfies UiComponentDefinition;

export const contratoListaPuntos = {
  name: "ListaPuntos",
  description: "Lista de ideas sueltas, síntomas, causas o consejos, sin un orden obligatorio.",
  children: false,
  props: {
    titulo: s.anyOf([s.string("Título de la lista"), s.nullish()]),
    puntos: s.array("De dos a siete puntos breves", textoConMarcas("Un punto")),
  },
} satisfies UiComponentDefinition;

export const contratoPasos = {
  name: "Pasos",
  description: "Acciones o etapas que se siguen en orden (por ejemplo, qué hacer o cómo ocurre algo).",
  children: false,
  props: {
    titulo: s.anyOf([s.string("Título de los pasos"), s.nullish()]),
    pasos: s.array(
      "Los pasos, en orden",
      s.object("Un paso", {
        titulo: s.string("Nombre corto del paso"),
        texto: textoConMarcas("Qué se hace o qué ocurre en este paso"),
      }),
    ),
  },
} satisfies UiComponentDefinition;

export const contratoCifra = {
  name: "Cifra",
  description: "Destaca un dato numérico importante y lo explica con palabras.",
  children: false,
  props: {
    valor: s.string("El número con su unidad, por ejemplo «1 de cada 8» o «24 %»"),
    descripcion: s.string("Qué significa ese número, en una frase sencilla"),
    fuente: numeroDeFuente,
  },
} satisfies UiComponentDefinition;

export const contratoComparacion = {
  name: "Comparacion",
  description: "Pone lado a lado dos o tres cosas para ver sus diferencias (por ejemplo, mito y realidad).",
  children: false,
  props: {
    titulo: s.string("Qué se compara"),
    columnas: s.array(
      "De dos a tres columnas",
      s.object("Una columna", {
        titulo: s.string("Nombre de lo que se compara"),
        puntos: s.array("Características", textoConMarcas("Una característica")),
      }),
    ),
  },
} satisfies UiComponentDefinition;

export const contratoDefinicion = {
  name: "Definicion",
  description: "Explica una palabra técnica o difícil con palabras de todos los días.",
  children: false,
  props: {
    termino: s.string("La palabra que se explica"),
    explicacion: textoConMarcas("La explicación sencilla, con un ejemplo cotidiano si ayuda"),
  },
} satisfies UiComponentDefinition;

export const contratoPreguntasRespuestas = {
  name: "PreguntasRespuestas",
  description: "Preguntas que la gente suele hacerse sobre el tema, con su respuesta breve.",
  children: false,
  props: {
    preguntas: s.array(
      "De dos a cinco preguntas",
      s.object("Una pregunta con su respuesta", {
        pregunta: s.string("La pregunta, como la haría una persona común"),
        respuesta: textoConMarcas("La respuesta, breve y clara"),
      }),
    ),
  },
} satisfies UiComponentDefinition;

export const contratoAviso = {
  name: "Aviso",
  description:
    "Mensaje destacado. «consulta» recuerda acudir a un profesional de salud; «importante» advierte algo; «informativo» da un dato útil.",
  children: false,
  props: {
    tipo: s.enumeration("Tipo de aviso", ["informativo", "importante", "consulta"]),
    texto: textoConMarcas("El mensaje, en una o dos frases"),
  },
} satisfies UiComponentDefinition;

export const contratoFuentes = {
  name: "Fuentes",
  description: "Lista, al final de la página, las fuentes usadas. Solo números de la lista de fuentes entregada.",
  children: false,
  props: { numeros: s.array("Números de las fuentes usadas", numeroDeFuente) },
} satisfies UiComponentDefinition;

export const contratoSiguientesTemas = {
  name: "SiguientesTemas",
  description: "Al final de la página, sugiere de dos a cuatro temas para seguir aprendiendo, en el orden recomendado.",
  children: false,
  props: {
    temas: s.array(
      "Temas sugeridos",
      s.object("Un tema", {
        etiqueta: s.string("Nombre corto del tema, por ejemplo «Factores de riesgo»"),
        porQue: s.string("En una frase, qué va a aprender la persona"),
      }),
    ),
  },
} satisfies UiComponentDefinition;

export const contratoSinInformacion = {
  name: "SinInformacion",
  description: "Se usa sola cuando las fuentes entregadas no cubren lo que se pregunta. Nunca se inventa información.",
  children: false,
  props: { mensaje: s.string("Explica con amabilidad que no hay información sobre eso y sugiere preguntar otra cosa") },
} satisfies UiComponentDefinition;

/** Todos los contratos, en el orden en que se presentan al modelo. */
export const catalogo: UiComponentDefinition[] = [
  contratoSeccion,
  contratoEncabezado,
  contratoParrafo,
  contratoListaPuntos,
  contratoPasos,
  contratoCifra,
  contratoComparacion,
  contratoDefinicion,
  contratoPreguntasRespuestas,
  contratoAviso,
  contratoFuentes,
  contratoSiguientesTemas,
  contratoSinInformacion,
];
