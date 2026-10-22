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
  subject: "page:x",
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

  it.each([
    ["its daily quota ran out", 1_470_000],
    ["its line is long", 12_000],
  ])("uses the next provider when one has to wait because %s", async (_, waitMs) => {
    await expect(new FallbackProvider([limited(waitMs), answering("second")]).generateJson(request)).resolves.toEqual({
      text: "second",
    });
  });

  it("reports the shortest wait, with its place in line, when every provider has to wait", async () => {
    const inLine = (waitMs: number, ahead: number) =>
      new FakeProvider(() => {
        throw new RateLimitExceeded(waitMs, ahead);
      });

    await expect(new FallbackProvider([inLine(90_000, 4), inLine(30_000, 1)]).generateJson(request)).rejects.toMatchObject({
      waitMs: 30_000,
      ahead: 1,
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
