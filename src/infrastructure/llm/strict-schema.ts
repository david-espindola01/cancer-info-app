/**
 * Rules of Groq's strict mode (`response_format.json_schema.strict = true`): every object
 * lists all its properties in `required` and declares `additionalProperties: false`;
 * optional values are expressed as `anyOf` with `null`.
 */
const UNSUPPORTED_KEYWORDS = ["oneOf", "allOf", "not", "if", "patternProperties"] as const;

/** Maps whose values are schemas (their keys are names, not JSON Schema keywords). */
const SCHEMA_MAPS = new Set(["properties", "$defs", "definitions"]);

/** Returns the violations found; an empty array means the schema is valid. */
export function strictModeViolations(schema: unknown): string[] {
  const violations: string[] = [];
  checkSchema(schema, "$", violations);
  return violations;
}

function checkSchema(node: unknown, path: string, violations: string[]): void {
  if (Array.isArray(node)) {
    node.forEach((child, i) => checkSchema(child, `${path}[${i}]`, violations));
    return;
  }
  if (!isObject(node)) return;

  if (node.type === "object" || "properties" in node) {
    checkObject(node, path, violations);
  }
  for (const keyword of UNSUPPORTED_KEYWORDS) {
    if (keyword in node) violations.push(`${path}: uses "${keyword}", not supported`);
  }
  for (const [key, value] of Object.entries(node)) {
    if (SCHEMA_MAPS.has(key) && isObject(value)) {
      for (const [name, schema] of Object.entries(value)) {
        checkSchema(schema, `${path}.${key}.${name}`, violations);
      }
    } else {
      checkSchema(value, `${path}.${key}`, violations);
    }
  }
}

function checkObject(node: Record<string, unknown>, path: string, violations: string[]): void {
  const properties = isObject(node.properties) ? Object.keys(node.properties) : [];
  const required = Array.isArray(node.required) ? node.required : [];
  const missing = properties.filter((property) => !required.includes(property));

  if (missing.length > 0) {
    violations.push(`${path}: properties outside "required" (${missing.join(", ")})`);
  }
  if (node.additionalProperties !== false) {
    violations.push(`${path}: missing "additionalProperties: false"`);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
