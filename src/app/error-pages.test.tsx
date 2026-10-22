import { fireEvent, render, screen } from "@testing-library/react";
import TopicError from "./(topics)/error";
import NotFound from "./not-found";

describe("error pages", () => {
  it("«not found» explains what happened and leads home", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { level: 1, name: "No encontramos esta página" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
  });

  it("an error while showing a topic allows retrying", () => {
    const retry = vi.fn();
    render(<TopicError error={new Error("failure")} reset={retry} />);

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Algo salió mal");
    expect(retry).toHaveBeenCalled();
  });
});
