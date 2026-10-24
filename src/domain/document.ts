export type DocumentStatus = "pending" | "processing" | "ready" | "error";

/** An article uploaded by the team. */
export interface SourceDocument {
  id: string;
  title: string;
  /** Fingerprint of the cleaned text: identifies the same article even if the file name changes. */
  fingerprint: string;
  status: DocumentStatus;
  error: string | null;
  /** Whether the agents use it. The team can turn it off without losing what was read. */
  active: boolean;
  createdAt: Date;
}

/** A piece of a document's text, sized to fit in one request to the Reader Agent. */
export interface Chunk {
  documentId: string;
  position: number;
  text: string;
}
