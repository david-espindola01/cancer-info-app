/** A source that backs a page; the Presenter Agent only cites it by its number. */
export interface PageSource {
  number: number;
  title: string;
  reference: string;
}

export type PageStatus = "generating" | "ready" | "error";

/** The page of a topic, cached so it can be served to everyone without generating it again. */
export interface TopicPage {
  slug: string;
  topic: string;
  /** The Presenter Agent's JSON answer (`{ "ui": [...] }`); null if it was never generated. */
  ui: string | null;
  sources: PageSource[];
  /** Topics the page leads to, from most to least recommended (to prefetch them). */
  keywords: string[];
  /** Knowledge version it was generated with: if it changes, the page is regenerated. */
  corpusVersion: number;
  status: PageStatus;
}
