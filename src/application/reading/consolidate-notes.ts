import type { ChunkNotes } from "./schemas";

/**
 * Maximum items per list passed to consolidation. Keeps the final request below
 * ~4,000 tokens even when the article has many chunks.
 */
const LIMITS = { findings: 25, figures: 15, concepts: 20, limitations: 10 } as const;

/** Joins the notes of every chunk into a compact text, without duplicates and capped per list. */
export function consolidateNotes(title: string, notes: ChunkNotes[]): string {
  const merge = <T>(list: (n: ChunkNotes) => T[], key: (x: T) => string, max: number) =>
    withoutDuplicates(notes.flatMap(list), key).slice(0, max);

  const findings = merge((n) => n.findings, (f) => f, LIMITS.findings);
  const figures = merge((n) => n.figures, (f) => `${f.value}|${f.description}`, LIMITS.figures);
  const concepts = merge((n) => n.concepts, (c) => c.term, LIMITS.concepts);
  const limitations = merge((n) => n.limitations, (l) => l, LIMITS.limitations);
  const citation = notes.map((n) => n.citation.trim()).find((data) => data.length > 0) ?? "(not stated)";

  return [
    `File title: ${title}`,
    `Citation data: ${citation}`,
    section("Findings", findings),
    section("Figures", figures.map((f) => `${f.value}: ${f.description}`)),
    section("Terms", concepts.map((c) => `${c.term}: ${c.explanation}`)),
    section("Limitations", limitations),
  ].join("\n\n");
}

function withoutDuplicates<T>(list: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    const k = key(item).trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function section(name: string, lines: string[]): string {
  return `${name}:\n${lines.length > 0 ? lines.map((l) => `- ${l}`).join("\n") : "- (none)"}`;
}
