import { act, fireEvent, render, screen } from "@testing-library/react";
import { BotonEscuchar } from "./boton-escuchar";

class LecturaFalsa {
  lang = "";
  rate = 1;
  onend: (() => void) | null = null;
  constructor(readonly text: string) {}
}

const voz = { speak: vi.fn(), cancel: vi.fn() };

function conVoz() {
  vi.stubGlobal("speechSynthesis", voz);
  vi.stubGlobal("SpeechSynthesisUtterance", LecturaFalsa);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("BotonEscuchar", () => {
  it("no aparece si el navegador no puede leer en voz alta", () => {
    const { container } = render(<BotonEscuchar />);

    expect(container).toBeEmptyDOMElement();
  });

  it("lee el artículo en español y permite detener la lectura", () => {
    conVoz();
    render(
      <main>
        <BotonEscuchar />
        <article>
          <h1>Título</h1>
          <p>Un párrafo.</p>
        </article>
      </main>,
    );

    fireEvent.click(screen.getByRole("button", { name: "▶ Escuchar esta página" }));

    const lectura = voz.speak.mock.calls[0]![0] as LecturaFalsa;
    expect(lectura).toMatchObject({ lang: "es", text: "TítuloUn párrafo." });
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("Detener lectura");

    fireEvent.click(screen.getByRole("button", { name: "■ Detener lectura" }));
    expect(voz.cancel).toHaveBeenCalled();
    expect(screen.getByRole("button", { pressed: false })).toBeInTheDocument();
  });

  it("vuelve al estado inicial cuando termina de leer", () => {
    conVoz();
    render(
      <main>
        <BotonEscuchar />
        <article>Texto</article>
      </main>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();

    const lectura = voz.speak.mock.calls[0]![0] as LecturaFalsa;
    act(() => lectura.onend?.());

    expect(screen.getByRole("button", { pressed: false })).toHaveTextContent("Escuchar esta página");
  });

  it("no hace nada si no hay artículo que leer", () => {
    conVoz();
    render(<BotonEscuchar />);

    fireEvent.click(screen.getByRole("button"));

    expect(voz.speak).not.toHaveBeenCalled();
  });
});
