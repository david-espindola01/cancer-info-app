import { normalizeSlug } from "./slug";

/**
 * The Presenter Agent marks the keywords readers can pick to keep learning: `[[text]]`,
 * or `[[text|topic]]` when the target topic is written differently
 * (for example `[[tumores|tumor]]`).
 */
const MARK = /\[\[([^[\]|]+?)(?:\|([^[\]|]+?))?\]\]/g;

export type Segment = { kind: "text"; text: string } | { kind: "topic"; text: string; slug: string };

/**
 * Marks the first occurrence of `topic` (as a whole word, case-insensitive) outside the
 * existing marks. Returns the new text, or null if the topic does not appear.
 */
export function markFirstOccurrence(text: string, topic: string): string | null {
  if (!normalizeSlug(topic)) return null;
  const escaped = topic.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "iu");

  let marked = false;
  const parts = splitMarks(text).map((segment) => {
    if (segment.kind === "topic") return `[[${segment.text}|${segment.slug}]]`;
    if (marked) return segment.text;
    return segment.text.replace(pattern, (found) => {
      marked = true;
      return `[[${found}]]`;
    });
  });
  return marked ? parts.join("") : null;
}

export function splitMarks(text: string): Segment[] {
  const segments: Segment[] = [];
  let from = 0;
  for (const mark of text.matchAll(MARK)) {
    const [whole, visible, target] = mark;
    const slug = normalizeSlug(target ?? visible!);
    if (mark.index > from) segments.push({ kind: "text", text: text.slice(from, mark.index) });
    segments.push(slug ? { kind: "topic", text: visible!.trim(), slug } : { kind: "text", text: visible! });
    from = mark.index + whole.length;
  }
  if (from < text.length) segments.push({ kind: "text", text: text.slice(from) });
  return segments;
}
