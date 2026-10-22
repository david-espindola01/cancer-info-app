import { s, type UiComponentDefinition } from "@hashbrownai/core";

/*
 * Catalog of generic interfaces the Presenter Agent can use to build a page. They are
 * contracts without React: the server uses them for the schema the model follows and the
 * browser to register the components. None of them refers to a specific topic: they can
 * present any information.
 *
 * The descriptions guide the model and travel in every request, so they are short: what
 * applies to every text (it is Spanish, how to mark keywords) is in the instructions.
 * Keywords can be marked in the texts as [[word]] or [[word|topic]]: they are shown
 * underlined and lead to that topic's page.
 */

const markedText = (description: string) => s.string(`${description}; may mark [[keywords]]`);

const sourceNumber = s.number("Source number, from the list");

export const sectionContract = {
  name: "Section",
  description: "Groups components about one idea under a title.",
  children: "any",
  props: { title: s.string("Short title") },
} satisfies UiComponentDefinition;

export const headingContract = {
  name: "Heading",
  description: "Page title: once, first.",
  children: false,
  props: {
    title: s.string("Question or short sentence"),
    subtitle: s.anyOf([s.string("One-sentence summary"), s.nullish()]),
  },
} satisfies UiComponentDefinition;

export const paragraphContract = {
  name: "Paragraph",
  description: "Two to four short sentences.",
  children: false,
  props: { text: markedText("The paragraph") },
} satisfies UiComponentDefinition;

export const bulletListContract = {
  name: "BulletList",
  description: "Separate ideas, symptoms, causes or tips, in no particular order.",
  children: false,
  props: {
    title: s.anyOf([s.string("List title"), s.nullish()]),
    items: s.array("Two to seven items", markedText("One item")),
  },
} satisfies UiComponentDefinition;

export const stepsContract = {
  name: "Steps",
  description: "Actions or stages in order.",
  children: false,
  props: {
    title: s.anyOf([s.string("Title"), s.nullish()]),
    steps: s.array(
      "The steps, in order",
      s.object("One step", { title: s.string("Short name"), text: markedText("What happens") }),
    ),
  },
} satisfies UiComponentDefinition;

export const statContract = {
  name: "Stat",
  description: "A key number, explained in words.",
  children: false,
  props: {
    value: s.string("Number with its unit, e.g. «1 de cada 8»"),
    description: s.string("What it means, in one sentence"),
    source: sourceNumber,
  },
} satisfies UiComponentDefinition;

export const comparisonContract = {
  name: "Comparison",
  description: "Two or three things side by side (e.g. myth and fact).",
  children: false,
  props: {
    title: s.string("What is compared"),
    columns: s.array(
      "Two to three columns",
      s.object("One column", {
        title: s.string("Name"),
        items: s.array("Characteristics", markedText("One characteristic")),
      }),
    ),
  },
} satisfies UiComponentDefinition;

export const definitionContract = {
  name: "Definition",
  description: "Explains a difficult word with everyday words.",
  children: false,
  props: {
    term: s.string("The word"),
    explanation: markedText("Simple explanation"),
  },
} satisfies UiComponentDefinition;

export const faqContract = {
  name: "Faq",
  description: "Questions people often ask, with short answers.",
  children: false,
  props: {
    questions: s.array(
      "Two to five questions",
      s.object("One question", {
        question: s.string("As a person would ask it"),
        answer: markedText("Short answer"),
      }),
    ),
  },
} satisfies UiComponentDefinition;

export const noticeContract = {
  name: "Notice",
  description: "«consult»: see a health professional; «important»: a warning; «info»: a useful fact.",
  children: false,
  props: {
    kind: s.enumeration("Kind", ["info", "important", "consult"]),
    text: markedText("One or two sentences"),
  },
} satisfies UiComponentDefinition;

export const sourcesContract = {
  name: "Sources",
  description: "The sources used, at the end.",
  children: false,
  props: { numbers: s.array("Numbers of the sources used", sourceNumber) },
} satisfies UiComponentDefinition;

export const nextTopicsContract = {
  name: "NextTopics",
  description: "At the end: two to four topics to learn next, in order.",
  children: false,
  props: {
    topics: s.array(
      "Suggested topics",
      s.object("One topic", {
        label: s.string("Short name, e.g. «Factores de riesgo»"),
        reason: s.string("What the person will learn, in one sentence"),
      }),
    ),
  },
} satisfies UiComponentDefinition;

export const noInformationContract = {
  name: "NoInformation",
  description: "Alone, when the sources do not cover the topic. Never make anything up.",
  children: false,
  props: { message: s.string("Kindly says there is no information about it") },
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
