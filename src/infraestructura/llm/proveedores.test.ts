import { s } from "@hashbrownai/core";
import { LimiteExcedido, RespuestaInvalida } from "@/aplicacion/errores-llm";
import { contratoProveedorLLM } from "@/pruebas/contratos/proveedor-llm.contrato";
import { ProveedorFalso } from "./proveedor-falso";
import { ProveedorGroq } from "./proveedor-groq";

const esquema = s.object("Saludo", { texto: s.string("Un saludo") });
const peticion = { nombre: "saludo", sistema: "Sé amable", usuario: "Hola", esquema };

function respuestaHttp(estado: number, cuerpo: unknown, encabezados: Record<string, string> = {}) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json", ...encabezados },
  });
}

function completion(contenido: string) {
  return {
    id: "c1",
    object: "chat.completion",
    created: 0,
    model: "modelo",
    choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: contenido } }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  };
}

function groqCon(...respuestas: Response[]) {
  const fetchFalso = vi.fn<typeof fetch>(async () => respuestas.shift()!);
  const proveedor = new ProveedorGroq({ apiKey: "clave", modelo: "openai/gpt-oss-20b", esfuerzo: "low", fetch: fetchFalso });
  return { proveedor, fetchFalso };
}

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ProveedorFalso", () => {
  contratoProveedorLLM((respuesta) => new ProveedorFalso(() => respuesta));

  it("registra las peticiones recibidas", async () => {
    const proveedor = new ProveedorFalso(() => ({ texto: "hola" }));

    await proveedor.generarJson(peticion);

    expect(proveedor.peticiones).toEqual([peticion]);
  });
});

describe("ProveedorGroq", () => {
  contratoProveedorLLM((respuesta) => groqCon(respuestaHttp(200, completion(JSON.stringify(respuesta)))).proveedor);

  it("pide salida estructurada estricta con el modelo y el esfuerzo configurados", async () => {
    const { proveedor, fetchFalso } = groqCon(respuestaHttp(200, completion('{"texto":"hola"}')));

    await proveedor.generarJson(peticion);

    const [url, init] = fetchFalso.mock.calls[0]!;
    expect(String(url)).toBe("https://api.groq.com/openai/v1/chat/completions");
    const cuerpo = JSON.parse(String(init?.body));
    expect(cuerpo).toMatchObject({
      model: "openai/gpt-oss-20b",
      reasoning_effort: "low",
      max_completion_tokens: 3000,
      messages: [
        { role: "system", content: "Sé amable" },
        { role: "user", content: "Hola" },
      ],
      response_format: { type: "json_schema", json_schema: { name: "saludo", strict: true } },
    });
    expect(cuerpo.response_format.json_schema.schema).not.toHaveProperty("$schema");
  });

  it("registra los tokens usados en cada llamada", async () => {
    const { proveedor } = groqCon(respuestaHttp(200, completion('{"texto":"hola"}')));

    await proveedor.generarJson(peticion);

    expect(JSON.parse(vi.mocked(console.info).mock.calls[0]![0])).toMatchObject({
      evento: "llm",
      modelo: "openai/gpt-oss-20b",
      esquema: "saludo",
      tokensEntrada: 10,
      tokensSalida: 5,
    });
  });

  it.each([
    [{ "retry-after": "7" }, 7_000],
    [{ "x-ratelimit-reset-tokens": "11.6s" }, 11_600],
    [{ "x-ratelimit-reset-tokens": "1m2s" }, 62_000],
    [{ "x-ratelimit-reset-tokens": "raro" }, 15_000],
    [{}, 15_000],
  ])("ante un 429 con %j lanza LimiteExcedido de %i ms", async (encabezados, esperado) => {
    const { proveedor } = groqCon(respuestaHttp(429, { error: { message: "límite" } }, encabezados));

    const error = await proveedor.generarJson(peticion).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(LimiteExcedido);
    expect((error as LimiteExcedido).esperarMs).toBe(esperado);
  });

  it("traduce un 400 (JSON que no cumple el esquema) a RespuestaInvalida", async () => {
    const { proveedor } = groqCon(respuestaHttp(400, { error: { message: "json_validate_failed" } }));

    await expect(proveedor.generarJson(peticion)).rejects.toBeInstanceOf(RespuestaInvalida);
  });

  it("traduce un contenido que no es JSON a RespuestaInvalida", async () => {
    const { proveedor } = groqCon(respuestaHttp(200, completion("esto no es json")));

    await expect(proveedor.generarJson(peticion)).rejects.toBeInstanceOf(RespuestaInvalida);
  });

  it("deja pasar otros errores del servidor", async () => {
    const { proveedor } = groqCon(respuestaHttp(500, { error: { message: "caído" } }));

    await expect(proveedor.generarJson(peticion)).rejects.toMatchObject({ status: 500 });
  });

  it("no llama a Groq si el esquema no cumple el modo estricto", async () => {
    const { proveedor, fetchFalso } = groqCon();
    const esquemaConUnion = s.object("Raíz", { valor: s.anyOf([s.string("a"), s.number("b")]) });
    vi.spyOn(s, "toJsonSchema").mockReturnValueOnce({ type: "object", properties: { a: {} }, required: [] });

    await expect(proveedor.generarJson({ ...peticion, esquema: esquemaConUnion })).rejects.toThrow(
      /no cumple el modo estricto/,
    );
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
