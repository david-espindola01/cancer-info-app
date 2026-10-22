import { s } from "@hashbrownai/core";
import { InvalidAnswer, RateLimitExceeded } from "@/application/llm-errors";
import { skilletOutput } from "@/application/skillet-output";
import { llmProviderContract } from "@/testing/contracts/llm-provider.contract";
import { FakeProvider } from "./fake-provider";
import { GroqProvider } from "./groq-provider";

const schema = s.object("Greeting", { text: s.string("A greeting") });
const request = { output: skilletOutput("greeting", schema), system: "Be kind", user: "Hello", maxOutputTokens: 3_000 };

function httpResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function completion(content: string) {
  return {
    id: "c1",
    object: "chat.completion",
    created: 0,
    model: "model",
    choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content } }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  };
}

function groqWith(...responses: Response[]) {
  const fakeFetch = vi.fn<typeof fetch>(async () => responses.shift()!);
  const provider = new GroqProvider({ apiKey: "key", model: "openai/gpt-oss-20b", effort: "low", fetch: fakeFetch });
  return { provider, fakeFetch };
}

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FakeProvider", () => {
  llmProviderContract((answer) => new FakeProvider(() => answer));

  it("records the received requests", async () => {
    const provider = new FakeProvider(() => ({ text: "hola" }));

    await provider.generateJson(request);

    expect(provider.requests).toEqual([request]);
  });
});

describe("GroqProvider", () => {
  llmProviderContract((answer) => groqWith(httpResponse(200, completion(JSON.stringify(answer)))).provider);

  it("requests strict structured output with the configured model and effort", async () => {
    const { provider, fakeFetch } = groqWith(httpResponse(200, completion('{"text":"hola"}')));

    await provider.generateJson(request);

    const [url, init] = fakeFetch.mock.calls[0]!;
    expect(String(url)).toBe("https://api.groq.com/openai/v1/chat/completions");
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      model: "openai/gpt-oss-20b",
      reasoning_effort: "low",
      max_completion_tokens: 3000,
      messages: [
        { role: "system", content: "Be kind" },
        { role: "user", content: "Hello" },
      ],
      response_format: { type: "json_schema", json_schema: { name: "greeting", strict: true } },
    });
    expect(body.response_format.json_schema.schema).not.toHaveProperty("$schema");
  });

  it("logs the tokens used in each call", async () => {
    const { provider } = groqWith(httpResponse(200, completion('{"text":"hola"}')));

    await provider.generateJson(request);

    expect(JSON.parse(vi.mocked(console.info).mock.calls[0]![0])).toMatchObject({
      event: "llm",
      model: "openai/gpt-oss-20b",
      schema: "greeting",
      inputTokens: 10,
      outputTokens: 5,
    });
  });

  it("reports the tokens used and carries on even if recording them fails", async () => {
    const usages: unknown[] = [];
    const responses = [httpResponse(200, completion('{"text":"a"}')), httpResponse(200, completion('{"text":"b"}'))];
    const fakeFetch = vi.fn<typeof fetch>(async () => responses.shift()!);
    vi.spyOn(console, "error").mockImplementation(() => {});
    let fail = false;
    const provider = new GroqProvider({
      apiKey: "key",
      model: "m",
      effort: "low",
      fetch: fakeFetch,
      onUsage: async (usage) => {
        if (fail) throw new Error("database down");
        usages.push(usage);
      },
    });

    await provider.generateJson(request);
    fail = true;

    await expect(provider.generateJson(request)).resolves.toEqual({ text: "b" });
    expect(usages).toEqual([{ model: "m", tokens: 15 }]);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("llm-usage-not-recorded"));
  });

  it.each([
    [{ "retry-after": "7" }, 7_000],
    [{ "x-ratelimit-reset-tokens": "11.6s" }, 11_600],
    [{ "x-ratelimit-reset-tokens": "1m2s" }, 62_000],
    [{ "x-ratelimit-reset-tokens": "odd" }, 15_000],
    [{}, 15_000],
  ])("on a 429 with %j throws RateLimitExceeded of %i ms and logs it", async (headers, expected) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { provider } = groqWith(httpResponse(429, { error: { message: "limit" } }, headers));

    const error = await provider.generateJson(request).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RateLimitExceeded);
    expect((error as RateLimitExceeded).waitMs).toBe(expected);
    expect(JSON.parse(vi.mocked(console.warn).mock.calls[0]![0])).toMatchObject({
      event: "llm-rate-limit",
      waitMs: expected,
    });
  });

  it("translates a 400 (JSON that does not match the schema) to InvalidAnswer and logs it", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { provider } = groqWith(httpResponse(400, { error: { message: "json_validate_failed" } }));

    await expect(provider.generateJson(request)).rejects.toBeInstanceOf(InvalidAnswer);
    expect(JSON.parse(vi.mocked(console.warn).mock.calls[0]![0])).toMatchObject({ event: "llm-invalid-answer" });
  });

  it("uses a rejected answer with the stray-bracket quirk if, once recovered, it matches the schema", async () => {
    const { provider } = groqWith(
      httpResponse(400, { error: { message: "json_validate_failed", failed_generation: '[\n{"text":"hola"}\n]' } }),
    );

    await expect(provider.generateJson(request)).resolves.toEqual({ text: "hola" });
    expect(JSON.parse(vi.mocked(console.info).mock.calls[0]![0])).toMatchObject({ event: "llm-answer-recovered" });
  });

  it.each([
    ["is not recoverable", "{broken"],
    ["does not match the schema once recovered", '[{"other":1}]'],
  ])("translates a rejected answer that %s to InvalidAnswer", async (_, failed_generation) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { provider } = groqWith(httpResponse(400, { error: { message: "json_validate_failed", failed_generation } }));

    await expect(provider.generateJson(request)).rejects.toBeInstanceOf(InvalidAnswer);
  });

  it("translates content that is not JSON to InvalidAnswer", async () => {
    const { provider } = groqWith(httpResponse(200, completion("this is not json")));

    await expect(provider.generateJson(request)).rejects.toBeInstanceOf(InvalidAnswer);
  });

  it("lets other server errors through", async () => {
    const { provider } = groqWith(httpResponse(500, { error: { message: "down" } }));

    await expect(provider.generateJson(request)).rejects.toMatchObject({ status: 500 });
  });

  it("does not call Groq if the schema does not meet strict mode", async () => {
    const { provider, fakeFetch } = groqWith();
    const output = { ...request.output, jsonSchema: { type: "object", properties: { a: {} }, required: [] } };

    await expect(provider.generateJson({ ...request, output })).rejects.toThrow(/does not meet Groq's strict mode/);
    expect(fakeFetch).not.toHaveBeenCalled();
  });
});
