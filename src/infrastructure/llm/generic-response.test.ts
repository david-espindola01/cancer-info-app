import { createUiJsonSchema, s } from "@hashbrownai/core";
import { chunkNotesSchema, memorySchema } from "@/application/reading/schemas";
import { responseFromSchema } from "./generic-response";

const text = "<document>\nPrimera frase. Segunda frase.\n</document>";

describe("responseFromSchema", () => {
  it.each([
    ["notes", chunkNotesSchema],
    ["memory", memorySchema],
  ])("produces a valid answer for the %s schema", (_, schema) => {
    const answer = responseFromSchema(s.toJsonSchema(schema), text);

    expect(() => schema.validate(answer)).not.toThrow();
  });

  it("uses sentences from the received text and picks the first option of an enum or anyOf", () => {
    const schema = s.object("Root", {
      a: s.string("a"),
      b: s.string("b"),
      c: s.enumeration("c", ["x", "y"]),
      d: s.anyOf([s.nullish(), s.number("n")]),
      e: s.boolean("e"),
    });

    expect(responseFromSchema(s.toJsonSchema(schema), text)).toEqual({
      a: "Primera frase.",
      b: "Segunda frase.",
      c: "x",
      d: 1,
      e: true,
    });
  });

  it("uses a default text when it gets no sentences, and respects null", () => {
    expect(responseFromSchema({ type: "string" }, "")).toBe("Texto de prueba.");
    expect(responseFromSchema({ type: "null" }, "")).toBeNull();
    expect(responseFromSchema({ anyOf: [{ type: "null" }] }, "")).toBeNull();
  });

  it("terminates with recursive schemas (components with children)", () => {
    const schema = createUiJsonSchema({
      components: [{ name: "Section", description: "Groups", children: "any", props: { title: s.string("t") } }],
    });

    const answer = responseFromSchema(schema, text) as { ui: unknown[] };

    expect(answer.ui).toHaveLength(1);
    expect(JSON.stringify(answer)).toContain('"Section"');
  });

  it("tolerates a reference to a missing definition", () => {
    expect(responseFromSchema({ $ref: "#/$defs/missing" }, text)).toBe("Primera frase.");
  });
});
