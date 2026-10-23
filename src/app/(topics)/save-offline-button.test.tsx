import { act, fireEvent, render, screen } from "@testing-library/react";
import { FakeCacheStorage } from "@/testing/fake-caches";
import { SAVED_CACHE, TITLE_HEADER } from "./offline-library";
import { getSaved } from "./reading-history";
import { SaveOfflineButton } from "./save-offline-button";

const topic = { slug: "metastasis", title: "¿Qué es la metástasis?" };
let storage: FakeCacheStorage;
const fetchMock = vi.fn<typeof fetch>();

function phoneThatCanSave() {
  storage = new FakeCacheStorage(() => fetchMock);
  vi.stubGlobal("caches", storage);
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(navigator, "serviceWorker", { value: {}, configurable: true });
}

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "serviceWorker");
  document.head.innerHTML = "";
});

describe("SaveOfflineButton", () => {
  it("does not appear if the phone cannot keep pages", () => {
    const { container } = render(<SaveOfflineButton topic={topic} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("keeps the page with its title, and the page's own files, then allows removing it", async () => {
    phoneThatCanSave();
    document.head.innerHTML = `
      <script src="/_next/static/chunks/app.js"></script>
      <link rel="stylesheet" href="/_next/static/css/app.css">
      <script src="https://otro-sitio.com/externo.js"></script>`;
    fetchMock.mockImplementation(async (input) =>
      String(input).endsWith("/_next/static/css/app.css")
        ? new Response("", { status: 404 })
        : new Response("<html>página</html>", { headers: { "Content-Type": "text/html" } }),
    );
    render(<SaveOfflineButton topic={topic} />);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "⤓ Guardar para leer sin señal" })));

    expect(screen.getByRole("status")).toHaveTextContent("Guardada para leer sin señal");
    const saved = await (await storage.open(SAVED_CACHE)).match("/topic/metastasis");
    expect(await saved?.text()).toBe("<html>página</html>");
    expect(decodeURIComponent(saved!.headers.get(TITLE_HEADER)!)).toBe(topic.title);
    // Only the site's own files; one that fails does not stop the saving.
    expect(storage.paths("archivos-v1")).toEqual(["/_next/static/chunks/app.js"]);
    expect(getSaved()).toEqual([topic]);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Quitar" })));

    expect(screen.getByRole("button", { name: "⤓ Guardar para leer sin señal" })).toBeInTheDocument();
    expect(storage.paths(SAVED_CACHE)).toEqual([]);
    expect(getSaved()).toEqual([]);
  });

  it.each([
    ["the server answers with an error", async () => new Response("", { status: 500 })],
    [
      "there is no signal",
      async () => {
        throw new TypeError("Failed to fetch");
      },
    ],
  ])("says it could not save if %s", async (_, answer) => {
    phoneThatCanSave();
    fetchMock.mockImplementation(answer);
    render(<SaveOfflineButton topic={topic} />);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "⤓ Guardar para leer sin señal" })));

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo guardar");
    expect(getSaved()).toEqual([]);
  });

  it("shows that it is saving while the page downloads", async () => {
    phoneThatCanSave();
    let finish: (response: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<SaveOfflineButton topic={topic} />);

    fireEvent.click(screen.getByRole("button", { name: "⤓ Guardar para leer sin señal" }));

    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
    await act(async () => finish(new Response("ok")));
  });
});
