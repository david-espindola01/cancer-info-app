import { readFileSync } from "node:fs";
import { FakeCacheStorage } from "@/testing/fake-caches";
import { SAVED_CACHE, TITLE_HEADER } from "./(topics)/offline-library";

/* Runs public/sw.js as the browser would, with the network and the caches simulated. */

const ORIGIN = "http://localhost";
const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");

interface FakeEvent {
  request: Request;
  response?: Promise<Response>;
  respondWith(response: Promise<Response>): void;
  waitUntil(work: Promise<unknown>): void;
}

function startWorker(network: (request: Request) => Promise<Response>) {
  const listeners = new Map<string, (event: unknown) => void>();
  const waiting: Promise<unknown>[] = [];
  const storage = new FakeCacheStorage();
  const claim = vi.fn(async () => {});
  const self = {
    location: new URL(ORIGIN),
    clients: { claim },
    skipWaiting: vi.fn(),
    addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener),
  };
  const fetchMock = vi.fn((input: Request) => network(input));
  new Function("self", "caches", "fetch", source)(self, storage, fetchMock);

  function fetchEvent(path: string, init: RequestInit & { mode?: RequestMode } = {}): FakeEvent {
    const { mode, ...rest } = init;
    const request = new Request(new URL(path, ORIGIN), rest);
    // `mode: "navigate"` cannot be set from a constructor: it is simulated.
    if (mode === "navigate") Object.defineProperty(request, "mode", { value: "navigate" });
    const event: FakeEvent = {
      request,
      respondWith(response) {
        event.response = response;
      },
      waitUntil: (work) => void waiting.push(work),
    };
    listeners.get("fetch")!(event);
    return event;
  }

  return {
    storage,
    claim,
    fetchMock,
    install: () => listeners.get("install")!({}),
    activate: async () => {
      listeners.get("activate")!({ waitUntil: (work: Promise<unknown>) => waiting.push(work) });
      await Promise.all(waiting);
    },
    open: (path: string) => fetchEvent(path, { mode: "navigate" }),
    tap: (path: string, headers: Record<string, string> = {}) =>
      fetchEvent(`${path}?_rsc=abc`, { headers: { RSC: "1", ...headers } }),
    fetchEvent,
  };
}

const page = (html: string, headers: Record<string, string> = {}) =>
  new Response(html, { headers: { "Content-Type": "text/html", ...headers } });
const noSignal = async (): Promise<Response> => {
  throw new TypeError("Failed to fetch");
};

describe("service worker (public/sw.js)", () => {
  it("uses the same cache names and title header as the page that saves topics", () => {
    expect(source).toContain(`"${SAVED_CACHE}"`);
    expect(source).toContain(`"${TITLE_HEADER}"`);
  });

  it("takes over at once and deletes the caches of older versions", async () => {
    const worker = startWorker(noSignal);
    await worker.storage.open("temas-guardados-v0");
    await worker.storage.open(SAVED_CACHE);

    worker.install();
    await worker.activate();

    expect(await worker.storage.keys()).toEqual([SAVED_CACHE]);
    expect(worker.claim).toHaveBeenCalled();
  });

  it("with signal, serves the network and remembers the last 30 pages opened", async () => {
    const worker = startWorker(async (request) => page(`<p>${new URL(request.url).pathname}</p>`));

    for (let i = 0; i < 32; i++) await worker.open(`/topic/tema-${i}`).response;
    const response = await worker.open("/topic/tumor").response;

    expect(await response!.text()).toBe("<p>/topic/tumor</p>");
    const visited = worker.storage.paths("paginas-visitadas-v1");
    expect(visited).toHaveLength(30);
    expect(visited.at(-1)).toBe("/topic/tumor");
    expect(visited).not.toContain("/topic/tema-0");
  });

  it("does not remember pages the server answered with an error", async () => {
    const worker = startWorker(async () => new Response("fallo", { status: 500 }));

    expect((await worker.open("/topic/tumor").response)!.status).toBe(500);
    expect(worker.storage.paths("paginas-visitadas-v1")).toEqual([]);
  });

  it("without signal, serves the saved copy first, then the one opened recently", async () => {
    const worker = startWorker(noSignal);
    await (await worker.storage.open(SAVED_CACHE)).put(`${ORIGIN}/topic/tumor`, page("guardada"));
    await (await worker.storage.open("paginas-visitadas-v1")).put(`${ORIGIN}/topic/tumor`, page("visitada"));
    await (await worker.storage.open("paginas-visitadas-v1")).put(`${ORIGIN}/`, page("inicio"));

    expect(await (await worker.open("/topic/tumor?ref=1").response)!.text()).toBe("guardada");
    expect(await (await worker.open("/").response)!.text()).toBe("inicio");
  });

  it("without signal and without a copy, explains it and offers the saved topics", async () => {
    const worker = startWorker(noSignal);
    const saved = await worker.storage.open(SAVED_CACHE);
    await saved.put(`${ORIGIN}/topic/x`, page("x", { [TITLE_HEADER]: encodeURIComponent("<b>Tumor & más</b>") }));
    await saved.put(`${ORIGIN}/topic/sin-titulo`, page("y"));

    const response = await worker.open("/topic/otro").response;

    expect(response!.status).toBe(503);
    const html = await response!.text();
    expect(html).toContain("Sin señal");
    expect(html).toContain('<a href="/topic/x">&lt;b&gt;Tumor &amp; más&lt;/b&gt;</a>');
    expect(html).toContain('<a href="/topic/sin-titulo">/topic/sin-titulo</a>');
  });

  it("without signal and nothing saved, says how to save topics", async () => {
    const worker = startWorker(noSignal);

    expect(await (await worker.open("/topic/otro").response)!.text()).toContain("Guardar para leer sin señal");
  });

  it("when tapping a link without signal to a kept page, makes Next.js open it as a normal page", async () => {
    const worker = startWorker(noSignal);
    await (await worker.storage.open(SAVED_CACHE)).put(`${ORIGIN}/topic/tumor`, page("guardada"));

    const response = await worker.tap("/topic/tumor").response;

    expect(response!.headers.get("Content-Type")).toBe("text/html");
    expect(await response!.text()).toBe("");
    await expect(worker.tap("/topic/no-guardada").response).rejects.toThrow("Failed to fetch");
  });

  it("with signal, the data of a tapped link comes from the network untouched", async () => {
    const worker = startWorker(async () => new Response("rsc", { headers: { "Content-Type": "text/x-component" } }));

    expect(await (await worker.tap("/topic/tumor").response)!.text()).toBe("rsc");
  });

  it("keeps the app's files after downloading them once", async () => {
    const worker = startWorker(async () => new Response("código"));

    await worker.fetchEvent("/_next/static/chunks/app.js").response;
    await worker.fetchEvent("/_next/static/chunks/app.js").response;

    expect(worker.fetchMock).toHaveBeenCalledTimes(1);
    expect(worker.storage.paths("archivos-v1")).toEqual(["/_next/static/chunks/app.js"]);
  });

  it("does not keep app files that failed", async () => {
    const worker = startWorker(async () => new Response("", { status: 404 }));

    await worker.fetchEvent("/_next/static/chunks/viejo.js").response;

    expect(worker.storage.paths("archivos-v1")).toEqual([]);
  });

  it.each([
    ["sending data", () => ({ path: "/api/session", init: { method: "POST" } })],
    ["another site", () => ({ path: "https://otro-sitio.com/x", init: {} })],
    ["the API", () => ({ path: "/api/status", init: {} })],
    ["the team's panel", () => ({ path: "/upload", init: { mode: "navigate" as const } })],
    ["a prefetch", () => ({ path: "/topic/x", init: { headers: { RSC: "1", "Next-Router-Prefetch": "1" } } })],
    ["an image", () => ({ path: "/favicon.ico", init: {} })],
  ])("leaves %s to the browser", (_, request) => {
    const worker = startWorker(noSignal);
    const { path, init } = request();

    expect(worker.fetchEvent(path, init).response).toBeUndefined();
  });
});
