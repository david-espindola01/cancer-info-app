import { s, type UiComponentDefinition } from "@hashbrownai/core";

/*
 * Catalog of generic interfaces the Presenter Agent can use to build a page. They are
 * contracts without React: the server uses them for the schema the model follows and the
 * browser to register the components. None of them refers to a specific topic: they can
 * present any information. The descriptions guide the model; the text it writes is Spanish.
 *
 * Keywords can be marked in the texts as [[word]] or [[word|topic]]: they are shown
 * underlined and lead to that topic's page.
 */

const markedText = (description: string) =>
  s.string(`${description}, in plain Spanish. May mark keywords as [[word]] or [[word|topic]]`);

const sourceNumber = s.number("Number of the source backing the fact (from the given list of sources)");

export const sectionContract = {
  name: "Section",
  description: "Groups several components about the same idea under a title.",
  children: "any",
  props: { title: s.string("Short title of the section, in Spanish") },
} satisfies UiComponentDefinition;

export const headingContract = {
  name: "Heading",
  description: "Main title of the page. Used only once, at the start.",
  children: false,
  props: {
    title: s.string("Page title in Spanish, as a question or short sentence"),
    subtitle: s.anyOf([s.string("A Spanish sentence that summarizes the page"), s.nullish()]),
  },
} satisfies UiComponentDefinition;

export const paragraphContract = {
  name: "Paragraph",
  description: "An explanatory paragraph: two to four short, simple sentences.",
  children: false,
  props: { text: markedText("The paragraph") },
} satisfies UiComponentDefinition;

export const bulletListContract = {
  name: "BulletList",
  description: "A list of separate ideas, symptoms, causes or tips, with no required order.",
  children: false,
  props: {
    title: s.anyOf([s.string("Title of the list, in Spanish"), s.nullish()]),
    items: s.array("Two to seven short items", markedText("One item")),
  },
} satisfies UiComponentDefinition;

export const stepsContract = {
  name: "Steps",
  description: "Actions or stages that follow an order (for example, what to do or how something happens).",
  children: false,
  props: {
    title: s.anyOf([s.string("Title of the steps, in Spanish"), s.nullish()]),
    steps: s.array(
      "The steps, in order",
      s.object("One step", {
        title: s.string("Short name of the step, in Spanish"),
        text: markedText("What is done or what happens in this step"),
      }),
    ),
  },
} satisfies UiComponentDefinition;

export const statContract = {
  name: "Stat",
  description: "Highlights an important numeric fact and explains it in words.",
  children: false,
  props: {
    value: s.string("The number with its unit, in Spanish, for example «1 de cada 8» or «24 %»"),
    description: s.string("What that number means, in one simple Spanish sentence"),
    source: sourceNumber,
  },
} satisfies UiComponentDefinition;

export const comparisonContract = {
  name: "Comparison",
  description: "Puts two or three things side by side to see their differences (for example, myth and fact).",
  children: false,
  props: {
    title: s.string("What is being compared, in Spanish"),
    columns: s.array(
      "Two to three columns",
      s.object("One column", {
        title: s.string("Name of what is compared, in Spanish"),
        items: s.array("Characteristics", markedText("One characteristic")),
      }),
    ),
  },
} satisfies UiComponentDefinition;

export const definitionContract = {
  name: "Definition",
  description: "Explains a technical or difficult word with everyday words.",
  children: false,
  props: {
    term: s.string("The word being explained, in Spanish"),
    explanation: markedText("The simple explanation, with an everyday example if it helps"),
  },
} satisfies UiComponentDefinition;

export const faqContract = {
  name: "Faq",
  description: "Questions people often ask about the topic, with a short answer.",
  children: false,
  props: {
    questions: s.array(
      "Two to five questions",
      s.object("One question with its answer", {
        question: s.string("The question, in Spanish, as an ordinary person would ask it"),
        answer: markedText("The answer, short and clear"),
      }),
    ),
  },
} satisfies UiComponentDefinition;

export const noticeContract = {
  name: "Notice",
  description:
    "Highlighted message. «consult» reminds people to see a health professional; «important» warns about something; «info» gives a useful fact.",
  children: false,
  props: {
    kind: s.enumeration("Kind of notice", ["info", "important", "consult"]),
    text: markedText("The message, in one or two sentences"),
  },
} satisfies UiComponentDefinition;

export const sourcesContract = {
  name: "Sources",
  description: "Lists the sources used, at the end of the page. Only numbers from the given list of sources.",
  children: false,
  props: { numbers: s.array("Numbers of the sources used", sourceNumber) },
} satisfies UiComponentDefinition;

export const nextTopicsContract = {
  name: "NextTopics",
  description: "At the end of the page, suggests two to four topics to keep learning, in the recommended order.",
  children: false,
  props: {
    topics: s.array(
      "Suggested topics",
      s.object("One topic", {
        label: s.string("Short name of the topic, in Spanish, for example «Factores de riesgo»"),
        reason: s.string("In one Spanish sentence, what the person will learn"),
      }),
    ),
  },
} satisfies UiComponentDefinition;

export const noInformationContract = {
  name: "NoInformation",
  description: "Used alone when the given sources do not cover what is asked. Information is never made up.",
  children: false,
  props: {
    message: s.string("Kindly explains, in Spanish, that there is no information about it and suggests asking something else"),
  },
} satisfies UiComponentDefinition;

/** Every contract, in the order they are presented to the model. */
export const catalog: UiComponentDefinition[] = [
  sectionContract,
  headingContract,
  paragraphContract,
  bulletListContract,
  stepsContract,
  statContract,
  comparisonContract,
  definitionContract,
  faqContract,
  noticeContract,
  sourcesContract,
  nextTopicsContract,
  noInformationContract,
];
