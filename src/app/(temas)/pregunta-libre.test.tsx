import { fireEvent, render, screen } from "@testing-library/react";
import { PreguntaLibre } from "./pregunta-libre";

const ir = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: ir }) }));

afterEach(() => ir.mockClear());

function preguntar(texto: string) {
  render(<PreguntaLibre />);
  fireEvent.change(screen.getByLabelText("¿Qué más quieres saber?"), { target: { value: texto } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
}

describe("PreguntaLibre", () => {
  it("lleva a la página del tema preguntado", () => {
    preguntar("¿Cómo se previene el cáncer de piel?");

    expect(ir).toHaveBeenCalledWith("/tema/como-se-previene-el-cancer-de-piel");
  });

  it("no hace nada si la pregunta no tiene letras ni números", () => {
    preguntar("  ¿? ");

    expect(ir).not.toHaveBeenCalled();
  });
});
