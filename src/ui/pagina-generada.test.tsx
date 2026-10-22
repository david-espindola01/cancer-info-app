import { render, screen, within } from "@testing-library/react";
import { violacionesAccesibilidad } from "@/pruebas/accesibilidad";
import { FUENTES_EJEMPLO, PAGINA_EJEMPLO } from "@/pruebas/pagina-ejemplo";
import { catalogo } from "@/ui-contratos/contratos";
import { componentesExpuestos } from "./kit";
import { PaginaGenerada } from "./pagina-generada";

describe("PaginaGenerada", () => {
  it("dibuja una página completa del catálogo a partir del JSON del agente", () => {
    render(<PaginaGenerada ui={PAGINA_EJEMPLO} fuentes={FUENTES_EJEMPLO} />);

    expect(screen.getByRole("heading", { level: 1, name: "¿Qué es el cáncer?" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Cómo empieza" })).toBeInTheDocument();
    expect(screen.getByText("1 de cada 5")).toBeInTheDocument();
    expect(screen.getByText("Consulta a un profesional de salud")).toBeInTheDocument();
    expect(screen.getByText("¿Es contagioso?")).toBeInTheDocument();
  });

  it("subraya las palabras clave como enlaces a su tema", () => {
    render(<PaginaGenerada ui={PAGINA_EJEMPLO} fuentes={FUENTES_EJEMPLO} />);

    expect(screen.getByRole("link", { name: "células" })).toHaveAttribute("href", "/tema/celulas");
    expect(screen.getByRole("link", { name: "tumor" })).toHaveAttribute("href", "/tema/tumor");
  });

  it("sugiere los siguientes temas en el orden indicado", () => {
    render(<PaginaGenerada ui={PAGINA_EJEMPLO} fuentes={FUENTES_EJEMPLO} />);

    const sugerencias = within(screen.getByRole("navigation", { name: "Sigue aprendiendo" })).getAllByRole("link");
    expect(sugerencias.map((enlace) => enlace.getAttribute("href"))).toEqual([
      "/tema/factores-de-riesgo",
      "/tema/prevencion",
    ]);
  });

  it("muestra solo las fuentes citadas, con los datos entregados por el servidor", () => {
    render(<PaginaGenerada ui={PAGINA_EJEMPLO} fuentes={FUENTES_EJEMPLO} />);

    const fuentes = screen.getByRole("region", { name: "Fuentes" });
    expect(fuentes).toHaveTextContent("[1] Estudio de población. García L, 2024. Revista de Salud");
    expect(fuentes).not.toHaveTextContent("Otro estudio");
  });

  it("no tiene problemas de accesibilidad", async () => {
    const { container } = render(<PaginaGenerada ui={PAGINA_EJEMPLO} fuentes={FUENTES_EJEMPLO} />);

    expect(await violacionesAccesibilidad(container)).toEqual([]);
  });

  it.each([
    ["no es JSON", "esto no es json"],
    ["usa un componente que no está en el catálogo", JSON.stringify({ ui: [{ Inventado: { props: {} } }] })],
  ])("muestra un aviso en lugar de romperse si la respuesta %s", (_, ui) => {
    render(<PaginaGenerada ui={ui} fuentes={[]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo mostrar esta página.");
  });

  it("registra un componente por cada contrato del catálogo", () => {
    expect(componentesExpuestos.map((c) => c.name)).toEqual(catalogo.map((c) => c.name));
  });
});
