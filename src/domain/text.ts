import { createHash } from "node:crypto";

/** Headings that start the bibliography of a scientific article. */
const REFERENCES_HEADING =
  /^\s*(\d+\.?\s*)?(references|referencias|bibliograf[ií]a|bibliography|literature cited)\s*:?\s*$/im;

/** A short line repeated at least this many times is a page header or footer. */
const HEADER_REPETITIONS = 3;
const HEADER_MAX_LENGTH = 80;

/**
 * Prepares text extracted from a PDF for the Reader Agent: joins words split by a
 * hyphen, removes repeated headers and footers, removes the bibliography and normalizes
 * whitespace. Paragraphs end up separated by a blank line.
 */
export function cleanText(text: string): string {
  const unified = text.replace(/\r\n?/g, "\n").replace(/­/g, "");
  const withoutReferences = removeReferences(unified);
  const withoutHeaders = removeRepeatedLines(withoutReferences);

  return withoutHeaders
    .replace(/(\p{L})-\n(\p{Ll})/gu, "$1$2")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 0)
    .join("\n\n");
}

function removeReferences(text: string): string {
  const match = REFERENCES_HEADING.exec(text);
  // Only cut when the bibliography is in the second half (avoids cutting a table of contents).
  if (!match || match.index < text.length / 2) return text;
  return text.slice(0, match.index);
}

function removeRepeatedLines(text: string): string {
  const lines = text.split("\n");
  const counts = new Map<string, number>();
  for (const line of lines) {
    const key = line.trim();
    if (key.length > 0 && key.length <= HEADER_MAX_LENGTH) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return lines.filter((line) => (counts.get(line.trim()) ?? 0) < HEADER_REPETITIONS).join("\n");
}

/**
 * Splits the text into chunks of at most `maxCharacters`, without splitting paragraphs
 * unless a single paragraph already exceeds the maximum (then it is split by sentences
 * and, as a last resort, by characters).
 */
export function chunkText(text: string, maxCharacters: number): string[] {
  const pieces = text
    .split(/\n\s*\n/)
    .flatMap((paragraph) => splitIfTooLong(paragraph.trim(), maxCharacters))
    .filter((piece) => piece.length > 0);

  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    const joined = current ? `${current}\n\n${piece}` : piece;
    if (joined.length <= maxCharacters) {
      current = joined;
    } else {
      chunks.push(current);
      current = piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function splitIfTooLong(paragraph: string, max: number): string[] {
  if (paragraph.length <= max) return [paragraph];

  const parts: string[] = [];
  let current = "";
  for (const sentence of paragraph.split(/(?<=[.!?])\s+/)) {
    for (const slice of cutByCharacters(sentence, max)) {
      const joined = current ? `${current} ${slice}` : slice;
      if (joined.length <= max) {
        current = joined;
      } else {
        parts.push(current);
        current = slice;
      }
    }
  }
  if (current) parts.push(current);
  return parts;
}

function cutByCharacters(text: string, max: number): string[] {
  const slices: string[] = [];
  for (let start = 0; start < text.length; start += max) {
    slices.push(text.slice(start, start + max));
  }
  return slices;
}

/** SHA-256 fingerprint of the text: detects the same article uploaded twice. */
export function textFingerprint(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
