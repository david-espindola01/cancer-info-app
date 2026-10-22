/**
 * Extracts a PDF's text in the browser. `unpdf` is loaded only when used, so its weight
 * is not added to the other pages. Pages are separated by a blank line so they work as
 * paragraph boundaries.
 */
export async function extractPdfText(file: File): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
  const { text } = await extractText(pdf, { mergePages: false });
  return text.join("\n\n");
}
