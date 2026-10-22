import { createUiJsonSchema, s } from "@hashbrownai/core";
import { chunkNotesSchema, memorySchema } from "@/application/reading/schemas";
import { strictModeViolations } from "./strict-schema";

describe("strictModeViolations", () => {
  it.each([
    ["chunk notes", chunkNotesSchema],
    ["memory", memorySchema],
  ])("accepts the Reader Agent's %s schema (contract with Groq)", (_, schema) => {
    expect(strictModeViolations(s.toJsonSchema(schema))).toEqual([]);
  });

  it("accepts the UI schema Hashbrown generates (contract with Groq)", () => {
    const schema = createUiJsonSchema({
      components: [
        {
          name: "Section",
          description: "Groups other components",
          children: "any",
          props: { title: s.string("Title") },
        },
        {
          name: "Heading",
          description: "Title with optional subtitle",
          children: false,
          props: {
            title: s.string("Title"),
            subtitle: s.anyOf([s.string("Subtitle"), s.nullish()]),
          },
        },
        {
          name: "Notice",
          description: "Highlighted notice",
          children: false,
          props: {
            kind: s.enumeration("Kind", ["info", "important"]),
            items: s.array("Items", s.string("Item")),
          },
        },
      ],
    });

    expect(strictModeViolations(schema)).toEqual([]);
  });

  it("detects properties that are not in required", () => {
    const schema = {
      type: "object",
      properties: { a: { type: "string" }, b: { type: "string" } },
      required: ["a"],
      additionalProperties: false,
    };

    expect(strictModeViolations(schema)).toEqual(['$: properties outside "required" (b)']);
  });

  it("detects nested objects without additionalProperties: false", () => {
    const schema = {
      type: "object",
      properties: { child: { type: "object", properties: {}, required: [] } },
      required: ["child"],
      additionalProperties: false,
    };

    expect(strictModeViolations(schema)).toEqual(['$.properties.child: missing "additionalProperties: false"']);
  });

  it("detects unsupported JSON Schema keywords", () => {
    const schema = { $defs: { x: { oneOf: [{ type: "string" }, { type: "number" }] } } };

    expect(strictModeViolations(schema)).toEqual(['$.$defs.x: uses "oneOf", not supported']);
  });

  it("does not confuse a property named like a reserved keyword", () => {
    const schema = {
      type: "object",
      properties: { if: { type: "string" }, not: { type: "boolean" } },
      required: ["if", "not"],
      additionalProperties: false,
    };

    expect(strictModeViolations(schema)).toEqual([]);
  });
});
