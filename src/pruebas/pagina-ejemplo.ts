import type { FuenteVista } from "@/ui/fuentes";

/** Una página como la que arma el Agente Presentador, escrita a mano con todo el catálogo. */
export const PAGINA_EJEMPLO = JSON.stringify({
  ui: [
    { Encabezado: { props: { titulo: "¿Qué es el cáncer?", subtitulo: "Una explicación sencilla" } } },
    {
      Seccion: {
        props: { titulo: "Cómo empieza" },
        children: [
          {
            Parrafo: {
              props: {
                texto: "El cuerpo está hecho de [[células]]. A veces crecen sin control y forman un [[tumor]].",
              },
            },
          },
          { Definicion: { props: { termino: "Célula", explicacion: "La parte más pequeña de un ser vivo." } } },
          {
            Pasos: {
              props: {
                titulo: "Cómo ocurre",
                pasos: [
                  { titulo: "Daño", texto: "Una célula sufre un cambio." },
                  { titulo: "Crecimiento", texto: "Se multiplica sin control." },
                ],
              },
            },
          },
        ],
      },
    },
    {
      ListaPuntos: {
        props: { titulo: "Señales de alerta", puntos: ["Un bulto que crece", "Cansancio que no se va"] },
      },
    },
    { Cifra: { props: { valor: "1 de cada 5", descripcion: "personas tendrá cáncer en su vida", fuente: 1 } } },
    {
      Comparacion: {
        props: {
          titulo: "Mito y realidad",
          columnas: [
            { titulo: "Mito", puntos: ["Siempre es hereditario"] },
            { titulo: "Realidad", puntos: ["La mayoría no es hereditario"] },
          ],
        },
      },
    },
    {
      PreguntasRespuestas: {
        props: { preguntas: [{ pregunta: "¿Es contagioso?", respuesta: "No, no se contagia." }] },
      },
    },
    { Aviso: { props: { tipo: "consulta", texto: "Ante cualquier duda, visita tu centro de salud." } } },
    {
      SiguientesTemas: {
        props: {
          temas: [
            { etiqueta: "Factores de riesgo", porQue: "Qué aumenta la probabilidad." },
            { etiqueta: "Prevención", porQue: "Qué puedes hacer desde hoy." },
          ],
        },
      },
    },
    { Fuentes: { props: { numeros: [1] } } },
  ],
});

export const FUENTES_EJEMPLO: FuenteVista[] = [
  { numero: 1, titulo: "Estudio de población", referencia: "García L, 2024. Revista de Salud" },
  { numero: 2, titulo: "Otro estudio", referencia: "Pérez M, 2023" },
];
