import { acceptsChildren, validProps } from "./kit";

describe("kit", () => {
  it("checks the props against the component's contract", () => {
    expect(validProps("Paragraph", { text: "Hola" })).toBe(true);
    expect(validProps("Paragraph", { text: 1 })).toBe(false);
    expect(validProps("Paragraph", undefined)).toBe(false);
  });

  it("rejects components that are not in the catalog, even names objects already have", () => {
    expect(validProps("Invented", {})).toBe(false);
    expect(validProps("constructor", {})).toBe(false);
  });

  it("only groups of components accept children", () => {
    expect(acceptsChildren("Section")).toBe(true);
    expect(acceptsChildren("Paragraph")).toBe(false);
    expect(acceptsChildren("Invented")).toBe(false);
  });
});
