import { fireEvent, render, screen } from "@testing-library/react";
import { FreeQuestion } from "./free-question";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => push.mockClear());

function ask(text: string) {
  render(<FreeQuestion />);
  fireEvent.change(screen.getByLabelText("¿Qué más quieres saber?"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
}

describe("FreeQuestion", () => {
  it("goes to the page of the asked topic", () => {
    ask("¿Cómo se previene el cáncer de piel?");

    expect(push).toHaveBeenCalledWith("/topic/como-se-previene-el-cancer-de-piel");
  });

  it("does nothing if the question has no letters or digits", () => {
    ask("  ¿? ");

    expect(push).not.toHaveBeenCalled();
  });
});
