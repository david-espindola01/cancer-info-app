import { act, fireEvent, render, screen } from "@testing-library/react";
import { ListenButton } from "./listen-button";

class FakeUtterance {
  lang = "";
  rate = 1;
  onend: (() => void) | null = null;
  constructor(readonly text: string) {}
}

const voice = { speak: vi.fn(), cancel: vi.fn() };

function withVoice() {
  vi.stubGlobal("speechSynthesis", voice);
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("ListenButton", () => {
  it("does not appear if the browser cannot read aloud", () => {
    const { container } = render(<ListenButton />);

    expect(container).toBeEmptyDOMElement();
  });

  it("reads the article in Spanish and allows stopping", () => {
    withVoice();
    render(
      <main>
        <ListenButton />
        <article>
          <h1>Título</h1>
          <p>Un párrafo.</p>
        </article>
      </main>,
    );

    fireEvent.click(screen.getByRole("button", { name: "▶ Escuchar esta página" }));

    const utterance = voice.speak.mock.calls[0]![0] as FakeUtterance;
    expect(utterance).toMatchObject({ lang: "es", text: "TítuloUn párrafo." });
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("Detener lectura");

    fireEvent.click(screen.getByRole("button", { name: "■ Detener lectura" }));
    expect(voice.cancel).toHaveBeenCalled();
    expect(screen.getByRole("button", { pressed: false })).toBeInTheDocument();
  });

  it("reads the visible article, not the hidden ones of pages visited before", () => {
    withVoice();
    // jsdom has no layout: visibility is simulated from the inline style.
    Object.defineProperty(HTMLElement.prototype, "checkVisibility", {
      configurable: true,
      value(this: HTMLElement) {
        return this.style.display !== "none";
      },
    });
    onTestFinished(() => {
      delete (HTMLElement.prototype as { checkVisibility?: unknown }).checkVisibility;
    });
    render(
      <main>
        <ListenButton />
        <article style={{ display: "none" }}>Página anterior</article>
        <article>Página actual</article>
      </main>,
    );

    fireEvent.click(screen.getByRole("button"));

    expect((voice.speak.mock.calls[0]![0] as FakeUtterance).text).toBe("Página actual");
  });

  it("goes back to the initial state when it finishes reading", () => {
    withVoice();
    render(
      <main>
        <ListenButton />
        <article>Texto</article>
      </main>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();

    const utterance = voice.speak.mock.calls[0]![0] as FakeUtterance;
    act(() => utterance.onend?.());

    expect(screen.getByRole("button", { pressed: false })).toHaveTextContent("Escuchar esta página");
  });

  it("does nothing if there is no article to read", () => {
    withVoice();
    render(<ListenButton />);

    fireEvent.click(screen.getByRole("button"));

    expect(voice.speak).not.toHaveBeenCalled();
  });
});
