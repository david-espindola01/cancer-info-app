import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createUiJsonSchema } from "@hashbrownai/core";
import { strictModeViolations } from "@/infrastructure/llm/strict-schema";
import { catalog } from "./contracts";

const TOPIC_WORDS = /c[aá]ncer|tumou?r|oncol|quimio|chemo|met[aá]stas|radioterapia|radiotherapy/i;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));
}

describe("interface catalog", () => {
  it("its schema meets Groq's strict mode (contract)", () => {
    expect(strictModeViolations(createUiJsonSchema({ components: catalog }))).toEqual([]);
  });

  it("does not repeat component names", () => {
    const names = catalog.map((contract) => contract.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it("is generic: no contract or component refers to a specific topic", () => {
    const withTopic = ["src/ui", "src/ui-contracts"]
      .flatMap(sourceFiles)
      .filter((file) => TOPIC_WORDS.test(readFileSync(file, "utf8")));

    expect(withTopic).toEqual([]);
  });
});
