import { render, screen } from "@testing-library/react";
import { useOffline } from "next/offline";
import { LoadingMessage, OfflineNotice } from "./connection-status";

vi.mock("next/offline", () => ({ useOffline: vi.fn(() => false) }));

describe("connection status", () => {
  it("with signal shows no notice and the loading message says it is being prepared", () => {
    render(
      <>
        <OfflineNotice />
        <LoadingMessage />
      </>,
    );

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Estamos preparando esta información");
  });

  it.each([
    [{ ahead: 0, waitMs: 3_000 }, "Estamos preparando esta información"],
    [{ ahead: 1, waitMs: 40_000 }, "Antes de esta hay 1 página en preparación. Tiempo estimado: menos de un minuto."],
    [{ ahead: 0, waitMs: 60_000 }, "Hay mucha gente consultando en este momento. Tiempo estimado: un minuto."],
    [{ ahead: 9, waitMs: 2_700_000 }, "Antes de esta hay 9 páginas en preparación. Tiempo estimado: unos 45 minutos."],
    [{ ahead: 0, waitMs: 7_200_000 }, "Tiempo estimado: más de una hora."],
  ])("with its place in line %j says «%s»", (place, message) => {
    render(<LoadingMessage place={place} />);

    expect(screen.getByRole("status")).toHaveTextContent(message);
  });

  it("without signal says reading can go on and that new content will arrive later", () => {
    vi.mocked(useOffline).mockReturnValue(true);

    render(
      <>
        <OfflineNotice />
        <LoadingMessage />
      </>,
    );

    const messages = screen.getAllByRole("status").map((m) => m.textContent);
    expect(messages).toEqual([
      expect.stringContaining("Sin señal. Puedes seguir leyendo"),
      expect.stringContaining("se cargará apenas vuelva la señal"),
    ]);
  });
});
