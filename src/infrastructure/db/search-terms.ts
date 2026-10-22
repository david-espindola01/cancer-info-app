/** Words shorter than this («de», «el», «la») add nothing to the search. */
const MIN_LENGTH = 3;

/**
 * Extracts from a free query the words that can safely be passed to `to_tsquery`:
 * only letters and digits, without operators or symbols.
 */
export function searchTerms(query: string): string[] {
  const words = query
    .normalize("NFC")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= MIN_LENGTH);
  return [...new Set(words)];
}
