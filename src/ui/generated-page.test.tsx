import { render, screen, within } from "@testing-library/react";
import { accessibilityViolations } from "@/testing/accessibility";
import { SAMPLE_PAGE, SAMPLE_SOURCES } from "@/testing/sample-page";
import { catalog } from "@/ui-contracts/contracts";
import { GeneratedPage } from "./generated-page";
import { components } from "./kit";

describe("GeneratedPage", () => {
  it("renders a full catalog page from the agent's JSON", () => {
    render(<GeneratedPage ui={SAMPLE_PAGE} sources={SAMPLE_SOURCES} />);

    expect(screen.getByRole("heading", { level: 1, name: "¿Qué es el cáncer?" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Cómo empieza" })).toBeInTheDocument();
    expect(screen.getByText("1 de cada 5")).toBeInTheDocument();
    expect(screen.getByText("Consulta a un profesional de salud")).toBeInTheDocument();
    expect(screen.getByText("¿Es contagioso?")).toBeInTheDocument();
  });

  it("underlines the keywords as links to their topic", () => {
    render(<GeneratedPage ui={SAMPLE_PAGE} sources={SAMPLE_SOURCES} />);

    expect(screen.getByRole("link", { name: "células" })).toHaveAttribute("href", "/topic/celulas");
    expect(screen.getByRole("link", { name: "tumor" })).toHaveAttribute("href", "/topic/tumor");
  });

  it("suggests the next topics in the given order", () => {
    render(<GeneratedPage ui={SAMPLE_PAGE} sources={SAMPLE_SOURCES} />);

    const suggestions = within(screen.getByRole("navigation", { name: "Sigue aprendiendo" })).getAllByRole("link");
    expect(suggestions.map((link) => link.getAttribute("href"))).toEqual([
      "/topic/factores-de-riesgo",
      "/topic/prevencion",
    ]);
    // The first one is the suggested next step.
    expect(suggestions[0]).toHaveTextContent("Te recomendamos");
    expect(suggestions[1]).not.toHaveTextContent("Te recomendamos");
  });

  it("shows only the cited sources, with the data delivered by the server", () => {
    render(<GeneratedPage ui={SAMPLE_PAGE} sources={SAMPLE_SOURCES} />);

    const sources = screen.getByRole("region", { name: "Fuentes" });
    expect(sources).toHaveTextContent("[1] Estudio de población. García L, 2024. Revista de Salud");
    expect(sources).not.toHaveTextContent("Otro estudio");
  });

  it("has no accessibility problems", async () => {
    const { container } = render(<GeneratedPage ui={SAMPLE_PAGE} sources={SAMPLE_SOURCES} />);

    expect(await accessibilityViolations(container)).toEqual([]);
  });

  it.each([
    ["is not JSON", "esto no es json"],
    ["uses a component that is not in the catalog", JSON.stringify({ ui: [{ Invented: { props: {} } }] })],
  ])("shows a notice instead of breaking if the answer %s", (_, ui) => {
    render(<GeneratedPage ui={ui} sources={[]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo mostrar esta página.");
  });

  it("leaves out a component whose props do not follow its contract and keeps the rest", () => {
    const ui = JSON.stringify({
      ui: [
        { Heading: { props: { title: "Título", subtitle: null } } },
        { Notice: { props: { kind: "invented", text: "No debería verse" } } },
        { Paragraph: { props: { text: 42 } } },
      ],
    });
    render(<GeneratedPage ui={ui} sources={[]} />);

    expect(screen.getByRole("heading", { level: 1, name: "Título" })).toBeInTheDocument();
    expect(screen.queryByText("No debería verse")).not.toBeInTheDocument();
    expect(screen.getByRole("article").children).toHaveLength(1);
  });

  it("renders the components nested in a section, and ignores children of those that take none", () => {
    const ui = JSON.stringify({
      ui: [
        {
          Section: {
            props: { title: "Grupo" },
            children: [{ Paragraph: { props: { text: "Adentro" } } }],
          },
        },
        {
          Paragraph: {
            props: { text: "Solo" },
            children: [{ Paragraph: { props: { text: "Hijo ignorado" } } }],
          },
        },
      ],
    });
    render(<GeneratedPage ui={ui} sources={[]} />);

    expect(within(screen.getByRole("region", { name: "Grupo" })).getByText("Adentro")).toBeInTheDocument();
    expect(screen.queryByText("Hijo ignorado")).not.toBeInTheDocument();
  });

  it.each([
    ["has no ui list", JSON.stringify({ page: [] })],
    ["is null", "null"],
    ["has malformed nodes", JSON.stringify({ ui: [null, "texto", { Heading: {}, Paragraph: {} }] })],
  ])("shows the notice if the answer %s", (_, ui) => {
    render(<GeneratedPage ui={ui} sources={[]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo mostrar esta página.");
  });

  it("registers one component per catalog contract", () => {
    expect(Object.keys(components)).toEqual(catalog.map((c) => c.name));
  });

  it("is rendered on the server: the browser does not download Hashbrown", async () => {
    const { readFile } = await import("node:fs/promises");
    const files = ["generated-page.tsx", "kit.ts"].map((file) => readFile(new URL(file, import.meta.url), "utf8"));
    for (const source of await Promise.all(files)) {
      expect(source).not.toMatch(/^["']use client["']/m);
      expect(source).not.toContain("@hashbrownai/react");
    }
  });
});
