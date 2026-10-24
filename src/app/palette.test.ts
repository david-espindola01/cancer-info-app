import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = join(process.cwd(), "src");
const css = readFileSync(join(SOURCE, "app", "globals.css"), "utf8");

function componentFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx"))
    .map((entry) => join(entry.parentPath, entry.name));
}

describe("color palette", () => {
  it("defines every color-* class the components use (a renamed color would leave them colorless)", () => {
    const used = new Set(componentFiles(SOURCE).flatMap((file) => readFileSync(file, "utf8").match(/\bcolor-[a-z]+\b/g) ?? []));

    const undefinedClasses = [...used].filter((name) => !new RegExp(`\\.${name}\\b`).test(css));

    expect(undefinedClasses).toEqual([]);
  });
});
