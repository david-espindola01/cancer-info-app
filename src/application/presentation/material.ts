import type { PageSource } from "@/domain/page";
import type { FoundMemory } from "../ports";

/**
 * Cap on the material the Presenter receives (~1,300 tokens). With the catalog schema
 * (~2,900), the instructions (~700) and the answer, each page stays below Groq's limit
 * of 8,000 tokens per minute.
 */
const MAX_MATERIAL_CHARACTERS = 5_000;

/** How many items of each memory list go into the material. */
const LIMITS = { findings: 5, figures: 4, concepts: 5, recommendations: 3, limitations: 3 } as const;

/**
 * Turns the found memories into numbered sources, as compact text and within budget.
 * Also returns the sources to show on the page and the topics they cover.
 */
export function prepareMaterial(memories: FoundMemory[]): {
  text: string;
  sources: PageSource[];
  topics: string[];
  /** The documents behind the sources, in the same order. */
  documentIds: string[];
} {
  const blocks: string[] = [];
  const sources: PageSource[] = [];
  const topics = new Set<string>();
  const documentIds: string[] = [];

  for (const { content, title, documentId } of memories) {
    const number = sources.length + 1;
    const block = describeMemory(number, content);
    if (blocks.length > 0 && [...blocks, block].join("\n\n").length > MAX_MATERIAL_CHARACTERS) break;

    blocks.push(block.slice(0, MAX_MATERIAL_CHARACTERS));
    sources.push({ number, title: content.plainTitle, reference: readableReference(content.reference, title) });
    content.topics.forEach((topic) => topics.add(topic));
    documentIds.push(documentId);
  }
  return { text: blocks.join("\n\n"), sources, topics: [...topics], documentIds };
}

/** «Authors (year). Journal» without the data the Reader did not find; if none, the document title. */
function readableReference(
  { authors, year, journal }: FoundMemory["content"]["reference"],
  documentTitle: string,
): string {
  const known = (value: string) => value.trim() !== "";
  const who = [known(authors) && authors, known(year) && `(${year})`].filter(Boolean).join(" ");
  const where = known(journal) ? journal : "";
  return [who, where].filter(Boolean).join(". ") || documentTitle;
}

function describeMemory(number: number, m: FoundMemory["content"]): string {
  const list = (title: string, items: string[], max: number) =>
    items.length > 0 ? `${title}:\n${items.slice(0, max).map((item) => `- ${item}`).join("\n")}` : "";

  return [
    `[${number}] ${m.plainTitle}`,
    `Topics covered: ${m.topics.join(", ")}`,
    `Main idea: ${m.mainIdea}`,
    `Summary: ${m.plainSummary}`,
    list("Findings", m.findings.map((f) => `${f.text} (evidence ${f.strength})`), LIMITS.findings),
    list("Figures", m.figures.map((f) => `${f.value}: ${f.description}`), LIMITS.figures),
    list("Terms", m.concepts.map((c) => `${c.term}: ${c.explanation}`), LIMITS.concepts),
    list("Study recommendations", m.recommendations, LIMITS.recommendations),
    list("Limitations", m.limitations, LIMITS.limitations),
  ]
    .filter(Boolean)
    .join("\n");
}
