import { s } from "@hashbrownai/core";
import { RateLimitExceeded } from "@/application/llm-errors";
import type { AiCapacity } from "@/application/ports";
import { skilletOutput } from "@/application/skillet-output";
import { CapacityGate, estimateTokens } from "./capacity-gate";

const request = {
  output: skilletOutput("greeting", s.object("Greeting", { text: s.string("A greeting") })),
  system: "s".repeat(4_000),
  user: "u".repeat(4_000),
  subject: "page:tumor",
  maxOutputTokens: 2_000,
};

function fakeCapacity(decision: Awaited<ReturnType<AiCapacity["requestTurn"]>>) {
  return {
    requestTurn: vi.fn<AiCapacity["requestTurn"]>(async () => decision),
    settle: vi.fn<AiCapacity["settle"]>(async () => {}),
    block: vi.fn<AiCapacity["block"]>(async () => {}),
  };
}

describe("estimateTokens", () => {
  it("counts the prompt and schema at 4 characters per token, and adds half of the answer's cap", () => {
    const promptTokens = Math.ceil((8_000 + JSON.stringify(request.output.jsonSchema).length) / 4);

    expect(estimateTokens(request)).toEqual({ promptTokens, tokens: promptTokens + 1_000 });
  });
});

describe("CapacityGate", () => {
  const options = { model: "m", priority: "visitor" as const, dailyShare: 0.7 };

  it("asks for a turn with the request's subject and estimate, and settles what was spent", async () => {
    const capacity = fakeCapacity({ kind: "granted", callId: "c1" });

    const turn = await new CapacityGate(capacity, options).enter(request);
    await turn.settle(3_100);

    expect(capacity.requestTurn).toHaveBeenCalledWith({
      model: "m",
      subject: "page:tumor",
      priority: "visitor",
      ...estimateTokens(request),
      dailyShare: 0.7,
    });
    expect(capacity.settle).toHaveBeenCalledWith("c1", 3_100);
  });

  it("throws how long to wait and how many are ahead when it is not its turn", async () => {
    const capacity = fakeCapacity({ kind: "wait", waitMs: 41_000, ahead: 3 });

    const error = await new CapacityGate(capacity, options).enter(request).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RateLimitExceeded);
    expect(error).toMatchObject({ waitMs: 41_000, ahead: 3 });
  });

  it("when the provider rejects the call, frees its reservation and blocks the model", async () => {
    const capacity = fakeCapacity({ kind: "granted", callId: "c1" });

    const turn = await new CapacityGate(capacity, options).enter(request);
    await turn.rejected(20_000);

    expect(capacity.settle).toHaveBeenCalledWith("c1", 0);
    expect(capacity.block).toHaveBeenCalledWith("m", 20_000);
  });
});
