import type { PageSource } from "@/domain/page";

/** A page like the one the Presenter Agent builds, written by hand with the whole catalog. */
export const SAMPLE_PAGE = JSON.stringify({
  ui: [
    { Heading: { props: { title: "¿Qué es el cáncer?", subtitle: "Una explicación sencilla" } } },
    {
      Section: {
        props: { title: "Cómo empieza" },
        children: [
          {
            Paragraph: {
              props: {
                text: "El cuerpo está hecho de [[células]]. A veces crecen sin control y forman un [[tumor]].",
              },
            },
          },
          { Definition: { props: { term: "Célula", explanation: "La parte más pequeña de un ser vivo." } } },
          {
            Steps: {
              props: {
                title: "Cómo ocurre",
                steps: [
                  { title: "Daño", text: "Una célula sufre un cambio." },
                  { title: "Crecimiento", text: "Se multiplica sin control." },
                ],
              },
            },
          },
        ],
      },
    },
    {
      BulletList: {
        props: { title: "Señales de alerta", items: ["Un bulto que crece", "Cansancio que no se va"] },
      },
    },
    { Stat: { props: { value: "1 de cada 5", description: "personas tendrá cáncer en su vida", source: 1 } } },
    {
      Comparison: {
        props: {
          title: "Mito y realidad",
          columns: [
            { title: "Mito", items: ["Siempre es hereditario"] },
            { title: "Realidad", items: ["La mayoría no es hereditario"] },
          ],
        },
      },
    },
    { Faq: { props: { questions: [{ question: "¿Es contagioso?", answer: "No, no se contagia." }] } } },
    { Notice: { props: { kind: "consult", text: "Ante cualquier duda, visita tu centro de salud." } } },
    {
      NextTopics: {
        props: {
          topics: [
            { label: "Factores de riesgo", reason: "Qué aumenta la probabilidad." },
            { label: "Prevención", reason: "Qué puedes hacer desde hoy." },
          ],
        },
      },
    },
    { Sources: { props: { numbers: [1] } } },
  ],
});

export const SAMPLE_SOURCES: PageSource[] = [
  { number: 1, title: "Estudio de población", reference: "García L, 2024. Revista de Salud" },
  { number: 2, title: "Otro estudio", reference: "Pérez M, 2023" },
];
