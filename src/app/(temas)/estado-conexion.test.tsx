import { render, screen } from "@testing-library/react";
import { useOffline } from "next/offline";
import { AvisoSinConexion, MensajeCarga } from "./estado-conexion";

vi.mock("next/offline", () => ({ useOffline: vi.fn(() => false) }));

describe("estado de la conexión", () => {
  it("con señal no muestra aviso y la carga dice que se está preparando", () => {
    render(
      <>
        <AvisoSinConexion />
        <MensajeCarga />
      </>,
    );

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Estamos preparando esta información");
  });

  it("sin señal avisa que se puede seguir leyendo y que lo nuevo llegará después", () => {
    vi.mocked(useOffline).mockReturnValue(true);

    render(
      <>
        <AvisoSinConexion />
        <MensajeCarga />
      </>,
    );

    const mensajes = screen.getAllByRole("status").map((m) => m.textContent);
    expect(mensajes).toEqual([
      expect.stringContaining("Sin señal. Puedes seguir leyendo"),
      expect.stringContaining("se cargará apenas vuelva la señal"),
    ]);
  });
});
