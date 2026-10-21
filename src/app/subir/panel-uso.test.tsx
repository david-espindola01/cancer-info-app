import { render, screen } from "@testing-library/react";
import { PanelUso } from "./panel-uso";

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("PanelUso", () => {
  it("muestra los tokens de hoy por modelo, las precargas y las páginas listas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json({ usoHoy: { precarga: 4, "tokens:openai/gpt-oss-20b": 12345 }, paginasListas: 27 }),
      ),
    );

    render(<PanelUso version="a" />);

    expect(await screen.findByText("openai/gpt-oss-20b: 12.345 tokens")).toBeInTheDocument();
    expect(screen.getByText("Páginas preparadas por adelantado: 4")).toBeInTheDocument();
    expect(screen.getByText("Páginas listas para servir: 27")).toBeInTheDocument();
  });

  it("indica cuando todavía no se usó la IA hoy", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ usoHoy: {}, paginasListas: 0 })));

    render(<PanelUso version="a" />);

    expect(await screen.findByText("Todavía no se usó la IA hoy.")).toBeInTheDocument();
    expect(screen.getByText("Páginas preparadas por adelantado: 0")).toBeInTheDocument();
  });

  it("no muestra nada si no se pudo consultar", async () => {
    const fetchFalso = vi.fn(async () => json({ error: "x" }, 500));
    vi.stubGlobal("fetch", fetchFalso);

    const { container } = render(<PanelUso version="a" />);

    await vi.waitFor(() => expect(fetchFalso).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
