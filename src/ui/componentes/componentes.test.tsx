import { render, screen } from "@testing-library/react";
import { violacionesAccesibilidad } from "@/pruebas/accesibilidad";
import { ProveedorFuentes } from "../fuentes";
import { Aviso } from "./destacados";
import { Encabezado } from "./estructura";
import { ListaPuntos, Pasos } from "./listas";
import { Fuentes, SinInformacion } from "./navegacion";

describe("componentes del catálogo con props mínimas", () => {
  it("Encabezado sin subtítulo muestra solo el título", () => {
    const { container } = render(<Encabezado titulo="Título" subtitulo={null} />);

    expect(screen.getByRole("heading", { level: 1, name: "Título" })).toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("ListaPuntos y Pasos sin título muestran solo su contenido", () => {
    render(
      <>
        <ListaPuntos titulo={null} puntos={["uno"]} />
        <Pasos titulo={null} pasos={[{ titulo: "Primero", texto: "hacer algo" }]} />
      </>,
    );

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("uno")).toBeInTheDocument();
    expect(screen.getByText("Primero")).toBeInTheDocument();
  });

  it.each([
    ["informativo", "Dato útil"],
    ["importante", "Importante"],
    ["consulta", "Consulta a un profesional de salud"],
  ] as const)("Aviso «%s» se identifica con el texto «%s», no solo con color", (tipo, etiqueta) => {
    render(<Aviso tipo={tipo} texto="Mensaje" />);

    expect(screen.getByText(etiqueta)).toBeInTheDocument();
    expect(screen.getByText("Mensaje")).toBeInTheDocument();
  });

  it("Fuentes no muestra nada si ninguna fuente citada existe", () => {
    const { container } = render(
      <ProveedorFuentes value={[{ numero: 1, titulo: "A", referencia: "R" }]}>
        <Fuentes numeros={[7]} />
      </ProveedorFuentes>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("SinInformacion ofrece volver al inicio", async () => {
    const { container } = render(<SinInformacion mensaje="No tenemos información sobre eso." />);

    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
    expect(await violacionesAccesibilidad(container)).toEqual([]);
  });
});
