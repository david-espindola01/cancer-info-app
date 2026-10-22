import { s } from "@hashbrownai/core";
import { InvalidAnswer } from "@/application/llm-errors";
import type { LlmProvider } from "@/application/llm-port";
import { skilletOutput } from "@/application/skillet-output";

const schema = s.object("Test", { name: s.string("A name"), age: s.number("An age") });
const request = { output: skilletOutput("test", schema), system: "system", user: "user", subject: "page:x", maxOutputTokens: 100 };

/**
 * Tests every LlmProvider must pass. `create` gets what the model «answers» and returns a
 * provider that will deliver it.
 */
export function llmProviderContract(create: (modelAnswer: unknown) => LlmProvider) {
  it("returns the answer when it matches the schema", async () => {
    const provider = create({ name: "Ana", age: 40 });

    expect(await provider.generateJson(request)).toEqual({ name: "Ana", age: 40 });
  });

  it("throws InvalidAnswer when the answer does not match the schema", async () => {
    const provider = create({ name: "Ana" });

    await expect(provider.generateJson(request)).rejects.toBeInstanceOf(InvalidAnswer);
  });
}
