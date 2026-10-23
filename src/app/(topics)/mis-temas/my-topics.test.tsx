import { render, screen, within } from "@testing-library/react";
import { topics } from "@/infrastructure/container";
import { accessibilityViolations } from "@/testing/accessibility";
import { FakeCacheStorage } from "@/testing/fake-caches";
import { recordSaved, recordVisit } from "../reading-history";
import { MyTopics } from "./my-topics";
import MyTopicsPage from "./page";

vi.mock("@/infrastructure/container", () => ({ topics: { ready: vi.fn() } }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

const topic = (slug: string, title: string) => ({ slug, title });

function links(group: string) {
  return within(screen.getByRole("region", { name: group }))
    .getAllByRole("link")
    .map((link) => [link.textContent?.replace("›", ""), link.getAttribute("href")]);
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "serviceWorker");
  vi.clearAllMocks();
});

describe("MyTopics", () => {
  it("lists the read topics and marks them among the ready ones", () => {
    recordVisit(topic("tumor", "¿Qué es un tumor?"), { start: false });
    recordVisit(topic("dieta", "Alimentación"), { start: false });

    render(<MyTopics ready={[topic("dieta", "Alimentación"), topic("prevencion", "Prevención")]} />);

    expect(links("Leídos hace poco")).toEqual([
      ["Alimentación", "/topic/dieta"],
      ["¿Qué es un tumor?", "/topic/tumor"],
    ]);
    expect(links("Todos los temas listos (2)")).toEqual([
      ["Alimentación✓ Leído", "/topic/dieta"],
      ["Prevención", "/topic/prevencion"],
    ]);
  });

  it("invites to start reading when nothing has been read, and hides an empty ready list", () => {
    render(<MyTopics ready={[]} />);

    expect(screen.getByRole("link", { name: "Empieza por «¿Qué es el cáncer?»" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("region", { name: /Todos los temas listos/ })).not.toBeInTheDocument();
    // On a phone that cannot keep pages, the saved group is not offered.
    expect(screen.queryByRole("region", { name: "Guardados para leer sin señal" })).not.toBeInTheDocument();
  });

  it("on a phone that can keep pages, shows the saved ones or how to save them", () => {
    vi.stubGlobal("caches", new FakeCacheStorage());
    Object.defineProperty(navigator, "serviceWorker", { value: {}, configurable: true });

    const { unmount } = render(<MyTopics ready={[]} />);
    expect(screen.getByRole("region", { name: "Guardados para leer sin señal" })).toHaveTextContent(
      "toca «Guardar para leer sin señal»",
    );
    unmount();

    recordSaved(topic("tumor", "Tumor"), true);
    render(<MyTopics ready={[]} />);
    expect(links("Guardados para leer sin señal")).toEqual([["Tumor", "/topic/tumor"]]);
  });

  it("has no accessibility problems", async () => {
    recordVisit(topic("tumor", "Tumor"), { start: false });
    const { container } = render(<MyTopics ready={[topic("tumor", "Tumor")]} />);

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});

describe("«Mis temas» page", () => {
  async function renderReadyList() {
    const page = MyTopicsPage();
    // The Suspense child is the async server component that reads the ready topics.
    const list = (page.props as { children: { type: () => Promise<React.ReactElement> } }).children;
    render(await list.type());
  }

  it("shows the topics that are ready on the server", async () => {
    vi.mocked(topics.ready).mockResolvedValueOnce([topic("tumor", "Tumor")]);

    await renderReadyList();

    expect(links("Todos los temas listos (1)")).toEqual([["Tumor", "/topic/tumor"]]);
  });

  it("if the list cannot be read, still shows what is on the phone", async () => {
    vi.mocked(topics.ready).mockRejectedValueOnce(new Error("sin base de datos"));

    await renderReadyList();

    expect(screen.getByRole("heading", { level: 1, name: "Mis temas" })).toBeInTheDocument();
  });
});
