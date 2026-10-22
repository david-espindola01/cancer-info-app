import { readDocument } from "./read-document";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

function serverAnswering(...responses: (Response | Error)[]) {
  const fakeFetch = vi.fn(async () => {
    const next = responses.shift()!;
    if (next instanceof Error) throw next;
    return next;
  });
  vi.stubGlobal("fetch", fakeFetch);
  return fakeFetch;
}

describe("readDocument", () => {
  it("moves forward until the document is ready and reports each step", async () => {
    const fakeFetch = serverAnswering(
      json({ kind: "progress", processed: 1, total: 2 }),
      json({ kind: "wait", waitMs: 7_400 }),
      json({ kind: "progress", processed: 2, total: 2 }),
      json({ kind: "ready" }),
    );
    const messages: string[] = [];
    const wait = vi.fn(async () => {});

    await readDocument("doc-1", (m) => messages.push(m), wait);

    expect(messages).toEqual([
      "Leyendo parte 2 de 2…",
      "Esperando el límite de uso de la IA (8 s)…",
      "Escribiendo la memoria del artículo…",
    ]);
    expect(wait).toHaveBeenCalledWith(7_400);
    expect(fakeFetch).toHaveBeenCalledWith("/api/documents/doc-1/step", { method: "POST" });
    expect(fakeFetch).toHaveBeenCalledTimes(4);
  });

  it.each([
    ["the server marks an error", () => json({ kind: "error", message: "invalid" })],
    ["the server answers an HTTP error", () => json({ error: "No existe ese documento." }, 404)],
    ["the network fails", () => new Error("offline")],
  ])("stops if %s", async (_, response) => {
    serverAnswering(response());

    await expect(readDocument("doc-1", () => {}, async () => {})).resolves.toBeUndefined();
  });

  it("really waits the given time when no other wait is passed", async () => {
    vi.useFakeTimers();
    serverAnswering(json({ kind: "wait", waitMs: 1_000 }), json({ kind: "ready" }));

    const reading = readDocument("doc-1", () => {});
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(reading).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
