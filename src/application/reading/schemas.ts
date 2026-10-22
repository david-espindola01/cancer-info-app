import { s } from "@hashbrownai/core";
import { skilletOutput } from "../skillet-output";

/*
 * Output contracts of the Reader Agent. Each schema is at once the TypeScript type, the
 * JSON Schema sent to the model and the validator of its answer. The content the model
 * writes is in Spanish (the audience's language); the field names are not shown to anyone.
 */

const figure = s.object("A numeric fact from the article", {
  value: s.string("The number with its unit, written in Spanish, for example «1 de cada 8» or «45 %»"),
  description: s.string("What that number measures, in plain Spanish"),
});

const concept = s.object("A technical term from the article", {
  term: s.string("The term as it is used in Spanish"),
  explanation: s.string("A plain-Spanish explanation, without other technical words"),
});

export const chunkNotesSchema = s.object("Notes on one part of the article", {
  findings: s.array("Results or claims in the text", s.string("One finding")),
  figures: s.array("Relevant numeric facts", figure),
  concepts: s.array("Technical terms that appear", concept),
  limitations: s.array("Limitations or caveats mentioned in the text", s.string("One limitation")),
  citation: s.string("Authors, year and journal if they appear in this part (usually at the start); empty string if not"),
});

export const memorySchema = s.object("Memory with the essentials of the article", {
  plainTitle: s.string("The article's title rewritten in plain Spanish"),
  mainIdea: s.string("The main idea in one or two short sentences"),
  plainSummary: s.string("A one-paragraph summary for anyone"),
  findings: s.array(
    "Main findings",
    s.object("One finding", {
      text: s.string("The finding in plain Spanish"),
      strength: s.enumeration("How strong the evidence is, according to the article itself", ["high", "medium", "low"]),
    }),
  ),
  concepts: s.array("Technical terms explained", concept),
  figures: s.array("Key numeric facts", figure),
  recommendations: s.array("Recommendations made by the article", s.string("One recommendation")),
  limitations: s.array("Limitations of the study", s.string("One limitation")),
  topics: s.array("Keywords of the article, in Spanish and lowercase", s.string("One topic")),
  reference: s.object("Data to cite the article", {
    authors: s.string("Authors, for example «García L, Pérez M, et al.»; empty string if unknown"),
    year: s.string("Publication year; empty string if unknown"),
    journal: s.string("Journal or source; empty string if unknown"),
  }),
});

export type ChunkNotes = s.Infer<typeof chunkNotesSchema>;
export type MemoryContent = s.Infer<typeof memorySchema>;
export const notesOutput = skilletOutput("chunk_notes", chunkNotesSchema);
export const memoryOutput = skilletOutput("article_memory", memorySchema);
