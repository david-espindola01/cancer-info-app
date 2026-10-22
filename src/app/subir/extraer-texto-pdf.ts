/**
 * Extrae el texto de un PDF en el navegador. `unpdf` se carga solo cuando se usa,
 * para no sumar su peso a las demás páginas. Las páginas se separan con una línea
 * en blanco para que funcionen como límites de párrafo.
 */
export async function extraerTextoPdf(archivo: File): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(await archivo.arrayBuffer()));
  const { text } = await extractText(pdf, { mergePages: false });
  return text.join("\n\n");
}
