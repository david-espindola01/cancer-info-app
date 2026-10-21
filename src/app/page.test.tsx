import { render, screen } from "@testing-library/react";
import Inicio from "./page";

describe("Inicio", () => {
  it("parte del tema «¿Qué es el cáncer?»", () => {
    render(<Inicio />);

    expect(
      screen.getByRole("heading", { level: 1, name: "¿Qué es el cáncer?" }),
    ).toBeInTheDocument();
  });
});
