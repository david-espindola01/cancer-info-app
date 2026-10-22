import { render, screen } from "@testing-library/react";
import { PaginaGenerada } from "@/ui/pagina-generada";
import { paginaSinInformacion } from "./pagina-ui";

/** Lo que arma el servidor sin la IA debe dibujarse con el catálogo del navegador. */
describe("paginaSinInformacion en el navegador", () => {
  it("se dibuja con su título y el enlace para volver al inicio", () => {
    render(<PaginaGenerada ui={JSON.stringify(paginaSinInformacion("dolor de espalda"))} fuentes={[]} />);

    expect(screen.getByRole("heading", { level: 1, name: "Dolor de espalda" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toBeInTheDocument();
  });
});
