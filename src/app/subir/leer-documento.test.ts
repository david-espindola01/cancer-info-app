import { leerDocumento } from "./leer-documento";

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

function servidorQueResponde(...respuestas: (Response | Error)[]) {
  const fetchFalso = vi.fn(async () => {
    const siguiente = respuestas.shift()!;
    if (siguiente instanceof Error) throw siguiente;
    return siguiente;
  });
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

describe("leerDocumento", () => {
  it("avanza hasta que el documento queda listo e informa cada paso", async () => {
    const fetchFalso = servidorQueResponde(
      json({ tipo: "avance", procesados: 1, total: 2 }),
      json({ tipo: "esperar", esperarMs: 7_400 }),
      json({ tipo: "avance", procesados: 2, total: 2 }),
      json({ tipo: "listo" }),
    );
    const mensajes: string[] = [];
    const esperar = vi.fn(async () => {});

    await leerDocumento("doc-1", (m) => mensajes.push(m), esperar);

    expect(mensajes).toEqual([
      "Leyendo parte 2 de 2…",
      "Esperando el límite de uso de la IA (8 s)…",
      "Escribiendo la memoria del artículo…",
    ]);
    expect(esperar).toHaveBeenCalledWith(7_400);
    expect(fetchFalso).toHaveBeenCalledWith("/api/documentos/doc-1/paso", { method: "POST" });
    expect(fetchFalso).toHaveBeenCalledTimes(4);
  });

  it.each([
    ["el servidor marca error", () => json({ tipo: "error", mensaje: "inválida" })],
    ["el servidor responde un error HTTP", () => json({ error: "No existe ese documento." }, 404)],
    ["falla la red", () => new Error("sin conexión")],
  ])("se detiene si %s", async (_, respuesta) => {
    servidorQueResponde(respuesta());

    await expect(leerDocumento("doc-1", () => {}, async () => {})).resolves.toBeUndefined();
  });

  it("espera de verdad el tiempo indicado si no se le pasa otra espera", async () => {
    vi.useFakeTimers();
    servidorQueResponde(json({ tipo: "esperar", esperarMs: 1_000 }), json({ tipo: "listo" }));

    const lectura = leerDocumento("doc-1", () => {});
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(lectura).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
