import type { NewDocument } from "@/application/ports";
import type { ChunkNotes, MemoryContent } from "@/application/reading/schemas";

let counter = 0;

/** A new document with a unique fingerprint on every call. */
export function newDocument(changes: Partial<NewDocument> = {}): NewDocument {
  counter += 1;
  return {
    title: `Artículo ${counter}`,
    fingerprint: `fingerprint-${counter}-${Math.random().toString(36).slice(2)}`,
    chunks: ["Primer fragmento.", "Segundo fragmento."],
    ...changes,
  };
}

/** Notes of a chunk, empty except for the given fields. */
export function sampleNotes(changes: Partial<ChunkNotes> = {}): ChunkNotes {
  return { findings: [], figures: [], concepts: [], limitations: [], citation: "", ...changes };
}

/** A complete, valid memory; `changes` replaces the given fields. */
export function sampleMemory(changes: Partial<MemoryContent> = {}): MemoryContent {
  return {
    plainTitle: "Un estudio sobre células",
    mainIdea: "Las células se renuevan.",
    plainSummary: "El estudio observó cómo se renuevan las células.",
    findings: [{ text: "Las células se dividen.", strength: "medium" }],
    concepts: [{ term: "Célula", explanation: "La parte más pequeña de un ser vivo." }],
    figures: [{ value: "1 de cada 3", description: "Personas del estudio" }],
    recommendations: ["Consultar al médico."],
    limitations: ["Muestra pequeña."],
    topics: ["células"],
    reference: { authors: "García L", year: "2024", journal: "Revista de Prueba" },
    ...changes,
  };
}
