import { s } from "@hashbrownai/core";
import { RateLimitExceeded } from "@/application/llm-errors";
import { skilletOutput } from "@/application/skillet-output";
import { llmProviderContract } from "@/testing/contracts/llm-provider.contract";
import { FakeProvider } from "./fake-provider";
import { FallbackProvider } from "./fallback-provider";

const request = {
  output: skilletOutput("greeting", s.object("Greeting", { text: s.string("A greeting") })),
  system: "s",
  user: "u",
  maxOutputTokens: 100,
};
const limited = (waitMs: number) =>
  new FakeProvider(() => {
    throw new RateLimitExceeded(waitMs);
  });
const answering = (text: string) => new FakeProvider(() => ({ text }));

describe("FallbackProvider", () => {
  llmProviderContract((answer) => new FallbackProvider([new FakeProvider(() => answer)]));

  it("uses the first provider while it answers", async () => {
    const second = answering("second");

    await expect(new FallbackProvider([answering("first"), second]).generateJson(request)).resolves.toEqual({
      text: "first",
    });
    expect(second.requests).toHaveLength(0);
  });

  it("uses the next provider when one hits a long limit", async () => {
    await expect(new FallbackProvider([limited(1_470_000), answering("second")]).generateJson(request)).resolves.toEqual({
      text: "second",
    });
  });

  it("passes a short wait on to the caller without switching", async () => {
    const second = answering("second");

    await expect(new FallbackProvider([limited(12_000), second]).generateJson(request)).rejects.toMatchObject({
      waitMs: 12_000,
    });
    expect(second.requests).toHaveLength(0);
  });

  it("reports the shortest wait when every provider is limited", async () => {
    await expect(new FallbackProvider([limited(900_000), limited(300_000)]).generateJson(request)).rejects.toMatchObject({
      waitMs: 300_000,
    });
  });

  it("does not hide other errors", async () => {
    const failing = new FakeProvider(() => {
      throw new Error("network down");
    });

    await expect(new FallbackProvider([failing, answering("second")]).generateJson(request)).rejects.toThrow("network down");
  });

  it("needs at least one provider", async () => {
    await expect(new FallbackProvider([]).generateJson(request)).rejects.toThrow("at least one provider");
  });
});
