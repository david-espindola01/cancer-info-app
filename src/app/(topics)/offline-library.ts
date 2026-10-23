import { recordSaved, type ReadTopic } from "./reading-history";

/*
 * Pages kept on the phone to read without signal (Cache API). The person chooses which
 * ones: saving downloads the page once more, and mobile data is expensive in the countryside.
 * `public/sw.js` reads these same caches when there is no connection: the names must match.
 */
export const SAVED_CACHE = "temas-guardados-v1";
const FILES_CACHE = "archivos-v1";
/** Title of the saved page, for the list the service worker shows without signal. */
export const TITLE_HEADER = "x-tema-titulo";

export const topicPath = (slug: string) => `/topic/${slug}`;

/** Whether this phone can keep pages: it needs the Cache API and service workers. */
export function canSaveOffline(): boolean {
  return typeof window !== "undefined" && "caches" in window && "serviceWorker" in navigator;
}

/** The page's own scripts and styles, so the saved page also looks right without signal. */
function pageFiles(): string[] {
  const urls = [
    ...[...document.querySelectorAll<HTMLScriptElement>("script[src]")].map((script) => script.src),
    ...[...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((link) => link.href),
  ];
  return urls.filter((url) => new URL(url, location.href).origin === location.origin);
}

/** Saves the topic's page. Returns false if it could not (no signal, full memory…). */
export async function saveTopic(topic: ReadTopic): Promise<boolean> {
  try {
    const response = await fetch(topicPath(topic.slug), { credentials: "same-origin" });
    if (!response.ok) return false;
    const headers = new Headers(response.headers);
    headers.set(TITLE_HEADER, encodeURIComponent(topic.title));
    const page = new Response(await response.arrayBuffer(), { status: 200, headers });
    await (await caches.open(SAVED_CACHE)).put(topicPath(topic.slug), page);

    // They are usually already in the browser's cache: adding them costs little or no data.
    const files = await caches.open(FILES_CACHE);
    await Promise.all(pageFiles().map((url) => files.add(url).catch(() => undefined)));

    recordSaved(topic, true);
    return true;
  } catch {
    return false;
  }
}

export async function removeTopic(topic: ReadTopic): Promise<void> {
  try {
    await (await caches.open(SAVED_CACHE)).delete(topicPath(topic.slug));
  } finally {
    recordSaved(topic, false);
  }
}
