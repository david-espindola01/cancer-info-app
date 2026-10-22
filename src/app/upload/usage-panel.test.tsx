import { render, screen } from "@testing-library/react";
import { UsagePanel } from "./usage-panel";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("UsagePanel", () => {
  it("shows today's tokens per model, the prefetches and the ready pages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ usageToday: { prefetch: 4, "tokens:openai/gpt-oss-20b": 12345 }, readyPages: 27 })),
    );

    render(<UsagePanel version="a" />);

    expect(await screen.findByText("openai/gpt-oss-20b: 12.345 tokens")).toBeInTheDocument();
    expect(screen.getByText("Páginas preparadas por adelantado: 4")).toBeInTheDocument();
    expect(screen.getByText("Páginas listas para servir: 27")).toBeInTheDocument();
  });

  it("says when the AI has not been used today", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ usageToday: {}, readyPages: 0 })));

    render(<UsagePanel version="a" />);

    expect(await screen.findByText("Todavía no se usó la IA hoy.")).toBeInTheDocument();
    expect(screen.getByText("Páginas preparadas por adelantado: 0")).toBeInTheDocument();
  });

  it("shows nothing if it could not be fetched", async () => {
    const fakeFetch = vi.fn(async () => json({ error: "x" }, 500));
    vi.stubGlobal("fetch", fakeFetch);

    const { container } = render(<UsagePanel version="a" />);

    await vi.waitFor(() => expect(fakeFetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
