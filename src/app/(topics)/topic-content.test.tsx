import { act, render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type { TopicResult } from "@/application/presentation/topic-pages";
import { topics } from "@/infrastructure/container";
import { SAMPLE_PAGE, SAMPLE_SOURCES } from "@/testing/sample-page";
import { TopicContent } from "./topic-content";

vi.mock("@/infrastructure/container", () => ({
  topics: { get: vi.fn(), regenerate: vi.fn(), prefetch: vi.fn() },
}));
vi.mock("next/server", () => ({ after: vi.fn(), connection: vi.fn(async () => {}) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "190.1.2.3, 10.0.0.1" }) }));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: () => ({ refresh }),
}));

const readyPage = {
  slug: "tumor",
  topic: "tumor",
  ui: SAMPLE_PAGE,
  sources: SAMPLE_SOURCES,
  keywords: ["benigno", "maligno"],
  corpusVersion: 1,
  status: "ready" as const,
};

async function show(result: TopicResult) {
  vi.mocked(topics.get).mockResolvedValueOnce(result);
  render(await TopicContent({ slug: "tumor" }));
}

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("TopicContent", () => {
  const laterTask = () => vi.mocked(after).mock.calls[0]![0] as () => Promise<void>;

  it("shows the stored page and, after answering, prefetches the topics it leads to", async () => {
    await show({ kind: "ready", page: readyPage, stale: false });
    expect(screen.getByRole("heading", { level: 1, name: "¿Qué es el cáncer?" })).toBeInTheDocument();

    await laterTask()();

    expect(topics.regenerate).not.toHaveBeenCalled();
    expect(topics.prefetch).toHaveBeenCalledWith(["benigno", "maligno"]);
  });

  it("names the page in the trail with its title, and the starting topic has no trail", async () => {
    await show({ kind: "ready", page: readyPage, stale: false });
    expect(screen.getByRole("navigation", { name: "Tu recorrido" })).toHaveTextContent("Inicio›¿Qué es el cáncer?");
    expect(JSON.parse(localStorage.getItem("temas-leidos")!)[0]).toEqual({ slug: "tumor", title: "¿Qué es el cáncer?" });

    await show({ kind: "ready", page: { ...readyPage, slug: "que-es-el-cancer" }, stale: false });
    expect(screen.getAllByRole("navigation", { name: "Tu recorrido" })).toHaveLength(1);
  });

  it("if the page has no title, the trail uses the topic", async () => {
    const untitled = JSON.stringify({ ui: [{ Paragraph: { props: { text: "Solo texto" } } }] });
    await show({ kind: "ready", page: { ...readyPage, ui: untitled }, stale: false });

    expect(screen.getByRole("navigation", { name: "Tu recorrido" })).toHaveTextContent("Inicio›tumor");
  });

  it("if it is stale, shows it anyway, regenerates it and then prefetches", async () => {
    await show({ kind: "ready", page: readyPage, stale: true });
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

    await laterTask()();

    expect(topics.regenerate).toHaveBeenCalledWith("tumor");
    expect(vi.mocked(topics.regenerate).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(topics.prefetch).mock.invocationCallOrder[0]!,
    );
  });

  it("while it is being prepared shows the wait and asks for the page again", async () => {
    vi.useFakeTimers();
    await show({ kind: "preparing", retryMs: 3_000, ahead: 0, waitMs: 3_000 });

    expect(screen.getByRole("status")).toHaveTextContent("Estamos preparando esta información");
    await act(() => vi.advanceTimersByTimeAsync(3_000));
    expect(refresh).toHaveBeenCalledTimes(1);
    // The server often answers with the same wait: it keeps asking anyway.
    await act(() => vi.advanceTimersByTimeAsync(6_000));
    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it("when there is a line, says how many pages go before and roughly how long it takes", async () => {
    await show({ kind: "preparing", retryMs: 30_000, ahead: 3, waitMs: 150_000 });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Hay mucha gente consultando en este momento. Antes de esta hay 3 páginas en preparación. Tiempo estimado: unos 3 minutos.",
    );
  });

  it("identifies the visitor by their IP to apply their limit of new pages", async () => {
    await show({ kind: "limit" });

    expect(topics.get).toHaveBeenCalledWith("tumor", "190.1.2.3");
    expect(screen.getByRole("alert")).toHaveTextContent("Pediste muchas páginas nuevas en poco tiempo.");
  });

  it("says so if the page could not be prepared", async () => {
    await show({ kind: "error" });

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos preparar esta página ahora.");
  });

  it("answers «not found» for an invalid topic", async () => {
    vi.mocked(topics.get).mockResolvedValueOnce({ kind: "invalid" });

    await expect(TopicContent({ slug: "¿?" })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
