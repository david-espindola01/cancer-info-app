import { createUiJsonSchema } from "@hashbrownai/core";
import { markFirstOccurrence, splitMarks } from "@/domain/markup";
import type { PageSource } from "@/domain/page";
import { normalizeSlug } from "@/domain/slug";
import {
  bulletListContract,
  catalog,
  headingContract,
  nextTopicsContract,
  noInformationContract,
  noticeContract,
  paragraphContract,
  sourcesContract,
  statContract,
} from "@/ui-contracts/contracts";
import { InvalidAnswer } from "../llm-errors";
import type { JsonOutput } from "../llm-port";

type Props = Record<string, unknown>;
/** A component of the answer: `{ "Name": { "props": {...}, "children": [...] } }`. */
type UiNode = Record<string, { props?: Props; children?: UiNode[] }>;
export interface PageUi {
  ui: UiNode[];
}

/** Minimum distinct underlined topics, so the person always has somewhere to go next. */
const MIN_MARKED_TOPICS = 3;
/** How many covered topics are suggested when there is no information about the request. */
const MAX_SUGGESTIONS = 4;

/* Texts shown to the public, so they are in Spanish. */
const CONSULT_NOTICE =
  "Esta información es para aprender y no reemplaza una consulta. Si tienes dudas o algún síntoma, acude a tu centro de salud.";
const SUGGESTION_REASON = "Sobre esto sí tenemos información.";

/**
 * Descriptions Hashbrown adds to every component («Component Props», «Section node»…):
 * they say nothing the structure does not, and they travel in every request.
 */
const GENERIC_DESCRIPTION = /^(|Component Props|Child Elements|List of elements|\w+ node)$/;

/** The schema without generic descriptions: about a quarter fewer tokens per page. */
function withoutGenericDescriptions(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(withoutGenericDescriptions);
  if (!node || typeof node !== "object") return node;
  return Object.fromEntries(
    Object.entries(node)
      .filter(([key, value]) => !(key === "description" && typeof value === "string" && GENERIC_DESCRIPTION.test(value)))
      .map(([key, value]) => [key, withoutGenericDescriptions(value)]),
  );
}

/**
 * The page the Presenter must return: the schema of the whole catalog (the browser
 * validates the same components). Groq in strict mode guarantees its shape; here only the
 * overall structure is checked before its content is reviewed.
 */
export const pageOutput: JsonOutput<PageUi> = {
  name: "page",
  jsonSchema: withoutGenericDescriptions(createUiJsonSchema({ components: catalog })) as Record<string, unknown>,
  validate(value) {
    const ui = (value as { ui?: unknown } | null)?.ui;
    if (!Array.isArray(ui) || !ui.every((node) => typeof node === "object" && node !== null)) {
      throw new Error('Expected { "ui": [components] }');
    }
    return value as PageUi;
  },
};

/**
 * Reviews a generated page: rejects citations of non-existent sources, adds the consult
 * notice and the sources if missing, ensures underlined words (with the topics the
 * sources cover) and extracts which topics it leads to (suggested ones first).
 */
export function reviewPage(
  page: PageUi,
  material: { sources: PageSource[]; topics: string[] },
  currentSlug: string,
): { page: PageUi; keywords: string[] } {
  const components = [...walk(page.ui)];
  const valid = new Set(material.sources.map((source) => source.number));
  const citations = components.flatMap(([name, props]) => citedNumbers(name, props));
  const invalid = citations.find((number) => !valid.has(number));
  if (invalid !== undefined) throw new InvalidAnswer(`cites source ${invalid}, which does not exist`);

  const ui = structuredClone(page.ui);
  const has = (name: string, condition: (props: Props) => boolean = () => true) =>
    components.some(([n, props]) => n === name && condition(props));

  // Every page starts with its title (the model sometimes answers «no information» without one).
  if (!has(headingContract.name)) ui.unshift(headingFor(currentSlug.replaceAll("-", " ")));

  if (has(noInformationContract.name)) {
    // Never a dead end: suggest topics that are covered.
    const suggestion = suggestTopics(material.topics, currentSlug);
    if (!has(nextTopicsContract.name) && suggestion) ui.push(suggestion);
    return { page: { ui }, keywords: targetTopics([...walk(ui)], currentSlug) };
  }

  ensureMarks(ui, material.topics, currentSlug);
  if (!has(noticeContract.name, (props) => props.kind === "consult")) {
    const closing = ui.findIndex((node) => nextTopicsContract.name in node || sourcesContract.name in node);
    ui.splice(closing === -1 ? ui.length : closing, 0, {
      [noticeContract.name]: { props: { kind: "consult", text: CONSULT_NOTICE } },
    });
  }
  if (!has(sourcesContract.name)) {
    const numbers = citations.length > 0 ? [...new Set(citations)] : [...valid];
    ui.push({ [sourcesContract.name]: { props: { numbers } } });
  }

  return { page: { ui }, keywords: targetTopics([...walk(ui)], currentSlug) };
}

/** If the model underlined few topics, marks the topics the sources cover in paragraphs and lists. */
function ensureMarks(ui: UiNode[], topics: string[], currentSlug: string): void {
  const texts = readableTexts(ui);
  const marked = new Set(
    texts.flatMap((text) =>
      splitMarks(text.value()).flatMap((segment) => (segment.kind === "topic" ? [segment.slug] : [])),
    ),
  );
  for (const topic of topics) {
    if (marked.size >= MIN_MARKED_TOPICS) return;
    const slug = normalizeSlug(topic);
    if (!slug || slug === currentSlug || marked.has(slug)) continue;
    for (const text of texts) {
      const updated = markFirstOccurrence(text.value(), topic);
      if (updated) {
        text.set(updated);
        marked.add(slug);
        break;
      }
    }
  }
}

/** Read and write access to the texts of paragraphs and lists, in order of appearance. */
function readableTexts(ui: UiNode[]): { value: () => string; set: (updated: string) => void }[] {
  return [...walk(ui)].flatMap(([name, props]) => {
    if (name === paragraphContract.name && typeof props.text === "string") {
      return [{ value: () => props.text as string, set: (updated: string) => void (props.text = updated) }];
    }
    if (name === bulletListContract.name && Array.isArray(props.items)) {
      const items = props.items as string[];
      return items.map((_, i) => ({ value: () => items[i]!, set: (updated: string) => void (items[i] = updated) }));
    }
    return [];
  });
}

function suggestTopics(topics: string[], currentSlug: string): UiNode | null {
  const seen = new Set([currentSlug]);
  const chosen = topics.filter((topic) => {
    const slug = normalizeSlug(topic);
    if (!slug || seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });
  if (chosen.length === 0) return null;
  const suggested = chosen.slice(0, MAX_SUGGESTIONS).map((label) => ({ label, reason: SUGGESTION_REASON }));
  return { [nextTopicsContract.name]: { props: { topics: suggested } } };
}

/** The page shown, without calling the AI, when no source covers the topic. */
const headingFor = (topic: string) => ({
  [headingContract.name]: { props: { title: topic.charAt(0).toUpperCase() + topic.slice(1), subtitle: null } },
});

export function noInformationPage(topic: string): PageUi {
  return {
    ui: [
      headingFor(topic),
      {
        [noInformationContract.name]: {
          props: {
            message: `Todavía no tenemos información sobre «${topic}» en los artículos de esta página. Prueba con otro tema o vuelve más adelante.`,
          },
        },
      },
    ],
  };
}

function* walk(nodes: UiNode[]): Generator<[string, Props]> {
  for (const node of nodes) {
    for (const [name, { props = {}, children }] of Object.entries(node)) {
      yield [name, props];
      if (Array.isArray(children)) yield* walk(children);
    }
  }
}

function citedNumbers(name: string, props: Props): number[] {
  if (name === statContract.name) return [Number(props.source)];
  if (name === sourcesContract.name && Array.isArray(props.numbers)) return props.numbers.map(Number);
  return [];
}

/** Topics the page leads to: suggested ones first (in their order), then the underlined ones. */
function targetTopics(components: [string, Props][], currentSlug: string): string[] {
  const suggested = components
    .filter(([name]) => name === nextTopicsContract.name)
    .flatMap(([, props]) => (props.topics as { label: string }[]).map((t) => normalizeSlug(t.label)));
  const underlined = components
    .flatMap(([, props]) => texts(props))
    .flatMap((text) => splitMarks(text))
    .flatMap((segment) => (segment.kind === "topic" ? [segment.slug] : []));
  return [...new Set([...suggested, ...underlined])].filter((slug) => slug && slug !== currentSlug);
}

function texts(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(texts);
  if (value && typeof value === "object") return Object.values(value).flatMap(texts);
  return [];
}
