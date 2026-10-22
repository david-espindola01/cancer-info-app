type Schema = Record<string, unknown>;

/** Beyond this depth, lists are left empty (stops recursive schemas). */
const MAX_DEPTH = 6;

/**
 * Builds a valid answer for a JSON Schema (objects, lists, enums, anyOf, $ref), with
 * texts taken from `text`. The `LLM_PROVIDER=fake` mode uses it to run the full flows
 * in CI and e2e tests without calling a real model.
 */
export function responseFromSchema(schema: Schema, text: string): unknown {
  const sentences = text
    .replace(/<\/?[a-z]+>/gi, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
  let next = 0;
  const sentence = () => (sentences.length > 0 ? sentences[next++ % sentences.length]! : "Texto de prueba.");

  const definitions = (schema.$defs ?? {}) as Record<string, Schema>;

  function build(node: Schema, depth: number): unknown {
    if (typeof node.$ref === "string") {
      return build(definitions[node.$ref.replace("#/$defs/", "")] ?? {}, depth);
    }
    if (Array.isArray(node.anyOf)) {
      const options = node.anyOf as Schema[];
      return build(options.find((option) => option.type !== "null") ?? options[0]!, depth);
    }
    if (Array.isArray(node.enum)) return node.enum[0];
    switch (node.type) {
      case "object": {
        const properties = (node.properties ?? {}) as Record<string, Schema>;
        return Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, build(value, depth + 1)]));
      }
      case "array":
        return depth >= MAX_DEPTH ? [] : [build(node.items as Schema, depth + 1)];
      case "number":
      case "integer":
        return 1;
      case "boolean":
        return true;
      case "null":
        return null;
      default:
        return sentence();
    }
  }

  return build(schema, 0);
}
