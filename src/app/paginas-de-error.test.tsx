import { fireEvent, render, screen } from "@testing-library/react";
import ErrorTema from "./(temas)/error";
import NoEncontrado from "./not-found";

describe("páginas de error", () => {
  it("«no encontrado» explica qué pasó y lleva al inicio", () => {
    render(<NoEncontrado />);

    expect(screen.getByRole("heading", { level: 1, name: "No encontramos esta página" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
  });

  it("un error al mostrar un tema permite reintentar", () => {
    const reintentar = vi.fn();
    render(<ErrorTema error={new Error("falla")} reset={reintentar} />);

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Algo salió mal");
    expect(reintentar).toHaveBeenCalled();
  });
});
