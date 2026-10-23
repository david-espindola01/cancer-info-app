/*
 * Service worker: lets people read without signal the pages they saved («Guardar para leer
 * sin señal») and the ones they opened recently. With signal, everything comes from the
 * network as usual (the cache is only used when the network fails), so content never goes
 * stale while there is connection.
 *
 * The cache names must match src/app/(topics)/offline-library.ts.
 */

const SAVED_CACHE = "temas-guardados-v1";
const VISITED_CACHE = "paginas-visitadas-v1";
const FILES_CACHE = "archivos-v1";
const TITLE_HEADER = "x-tema-titulo";
const MAX_VISITED = 30;
const CURRENT = [SAVED_CACHE, VISITED_CACHE, FILES_CACHE];

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => !CURRENT.includes(name)).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

/** The page's address without its query (Next.js adds `_rsc=` to its own requests). */
const pageKey = (url) => url.origin + url.pathname;

async function storedPage(url) {
  const saved = await (await caches.open(SAVED_CACHE)).match(pageKey(url));
  return saved ?? (await caches.open(VISITED_CACHE)).match(pageKey(url));
}

async function rememberVisited(url, response) {
  const cache = await caches.open(VISITED_CACHE);
  await cache.put(pageKey(url), response);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_VISITED)).map((key) => cache.delete(key)));
}

const escape = (text) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Shown when there is no signal and the page was not kept: it offers the ones that were. */
async function offlinePage() {
  const saved = await caches.open(SAVED_CACHE);
  const items = await Promise.all(
    (await saved.keys()).map(async (request) => {
      const title = decodeURIComponent((await saved.match(request))?.headers.get(TITLE_HEADER) ?? "");
      const path = new URL(request.url).pathname;
      return `<li><a href="${escape(path)}">${escape(title || path)}</a></li>`;
    }),
  );
  const list = items.length
    ? `<p>Estos temas sí están guardados en tu teléfono:</p><ul>${items.join("")}</ul>`
    : "<p>Cuando tengas señal, abre un tema y toca «Guardar para leer sin señal» para tenerlo siempre a mano.</p>";
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin señal</title><style>body{font:1.125rem/1.65 system-ui,sans-serif;max-width:40rem;margin:0 auto;padding:1.5rem 1rem;background:#fbfaf7;color:#1a1a1a}a{color:#0f6b63;font-weight:600}li{margin:.5rem 0}@media(prefers-color-scheme:dark){body{background:#121212;color:#f2f2f2}a{color:#6ee0d0}}</style></head><body><h1>Sin señal</h1><p>Esta página no está guardada en tu teléfono. Se cargará apenas vuelva la conexión.</p>${list}</body></html>`;
  return new Response(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

/** Opening a page (typing the address, reloading): network first, the kept copy if there is no signal. */
async function navigation(request, url) {
  try {
    const response = await fetch(request);
    if (response.ok) await rememberVisited(url, response.clone()).catch(() => undefined);
    return response;
  } catch {
    return (await storedPage(url)) ?? offlinePage();
  }
}

/**
 * Tapping a link inside the site: Next.js asks for the page's data (RSC). Without signal, if
 * the page is kept, it answers with something that is not RSC: Next.js then opens the page
 * normally, and `navigation` serves the kept copy.
 */
async function pageData(request, url) {
  try {
    return await fetch(request);
  } catch (error) {
    if (await storedPage(url)) return new Response("", { headers: { "Content-Type": "text/html" } });
    throw error;
  }
}

/** The app's files have their version in the name: once kept, they never change. */
async function appFile(request) {
  const cache = await caches.open(FILES_CACHE);
  const kept = await cache.match(request);
  if (kept) return kept;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone()).catch(() => undefined);
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // The team's panel and the API always need the network.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/upload")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(appFile(request));
  } else if (request.mode === "navigate") {
    event.respondWith(navigation(request, url));
  } else if (request.headers.get("RSC") === "1" && !request.headers.has("Next-Router-Prefetch")) {
    event.respondWith(pageData(request, url));
  }
});
