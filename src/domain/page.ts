import { withoutMarks } from "./markup";

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
  /**
   * Documents the page was built from: if one is turned off or deleted, the page is
   * forgotten. Null for pages built before this was recorded.
   */
  documentIds: string[] | null;
  /** Topics the page leads to, from most to least recommended (to prefetch them). */
  keywords: string[];
  /** Knowledge version it was generated with: if it changes, the page is regenerated. */
  corpusVersion: number;
  status: PageStatus;
}

/** A topic with the name people read: for the route trail, «Mis temas» and the topic list. */
export interface TopicSummary {
  slug: string;
  title: string;
}

/** The components of a page's JSON (`{ "ui": [...] }`), or none if it cannot be read. */
export function pageNodes(ui: string): unknown[] {
  try {
    const nodes = (JSON.parse(ui) as { ui?: unknown } | null)?.ui;
    return Array.isArray(nodes) ? nodes : [];
  } catch {
    return [];
  }
}

/** The title of a page (its Heading, without keyword marks), or null if it has none. */
export function pageTitle(ui: string): string | null {
  for (const node of pageNodes(ui)) {
    const title = (node as { Heading?: { props?: { title?: unknown } } } | null)?.Heading?.props?.title;
    if (typeof title === "string" && title.trim()) return withoutMarks(title).trim();
  }
  return null;
}

/** Whether the page has content, rather than saying the sources do not cover the topic. */
export function hasInformation(ui: string): boolean {
  const nodes = pageNodes(ui);
  return nodes.length > 0 && !nodes.some((node) => node !== null && typeof node === "object" && "NoInformation" in node);
}
