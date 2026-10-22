import { s } from "@hashbrownai/core";
import type { JsonOutput } from "./llm-port";

/** An output defined with Skillet: the same schema gives the JSON Schema and the validation. */
export function skilletOutput<E extends s.HashbrownType>(name: string, schema: E): JsonOutput<s.Infer<E>> {
  return {
    name,
    jsonSchema: s.toJsonSchema(schema) as Record<string, unknown>,
    validate(value) {
      schema.validate(value);
      return value as s.Infer<E>;
    },
  };
}
